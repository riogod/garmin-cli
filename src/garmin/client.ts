/**
 * Unified Garmin Connect API client: REST (connectapi), file downloads, GraphQL.
 * Based on garth http.Client: Bearer authorization, auto-refresh OAuth2 on expiry.
 */

import axios, { isAxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import type { GarminConfig } from '../lib/config.js';
import { debug } from '../lib/debug.js';
import { ensureSession, isOAuth2Expired, refreshOAuth2 } from './auth/index.js';
import { GRAPHQL } from './endpoints.js';
import type { GarminSession } from './types.js';

const USER_AGENT = 'GCM-iOS-5.19.1.2';

/** Default request timeout (ms), if not specified in config. */
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

/**
 * Garmin Connect API client.
 * Obtains session via ensureSession; refreshes token before requests if OAuth2 is expired.
 * Single concurrent refresh: parallel requests all wait for the same result.
 */
export class GarminClient {
  private session: GarminSession;
  private tokenDir: string | undefined;
  private requestTimeoutMs: number;
  /** Shared refresh promise to avoid calling refreshOAuth2 from multiple places simultaneously. */
  private refreshPromise: Promise<GarminSession> | null = null;

  constructor(session: GarminSession, tokenDir?: string, requestTimeoutMs?: number) {
    this.session = session;
    this.tokenDir = tokenDir;
    this.requestTimeoutMs =
      requestTimeoutMs !== undefined && requestTimeoutMs > 0 ? requestTimeoutMs : DEFAULT_REQUEST_TIMEOUT_MS;
  }

  /**
   * Creates a client: loads session from tokenDir or performs login.
   */
  static async create(config: GarminConfig): Promise<GarminClient> {
    const session = await ensureSession(config);
    return new GarminClient(session, config.tokenDir, config.requestTimeout);
  }

  private baseUrl(): string {
    return `https://connectapi.${this.session.domain}`;
  }

  private authHeaders(): Record<string, string> {
    return {
      'User-Agent': USER_AGENT,
      Authorization: `${this.session.oauth2.token_type} ${this.session.oauth2.access_token}`,
    };
  }

  /**
   * Refreshes OAuth2 (OAuth1→OAuth2 exchange). Subsequent calls wait for the same result.
   */
  private async refreshSession(): Promise<void> {
    if (this.refreshPromise) {
      this.session = await this.refreshPromise;
      return;
    }
    const promise = refreshOAuth2(this.session, this.tokenDir);
    this.refreshPromise = promise;
    try {
      this.session = await promise;
      debug('GarminClient refreshSession done');
    } finally {
      this.refreshPromise = null;
    }
  }

  /** Checks and refreshes session if needed (by expires_at or on 401). */
  private async ensureValidSession(): Promise<void> {
    if (isOAuth2Expired(this.session.oauth2)) {
      await this.refreshSession();
    }
  }

  /** Error codes/messages for which retry is worthwhile (network/server closed connection). */
  private static isRetryableNetworkError(err: unknown): boolean {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
    const message = err instanceof Error ? err.message : String(err);
    return (
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNABORTED' ||
      message.includes('socket hang up')
    );
  }

  /** Gateway response codes (502/503/504) for which retry might help. */
  private static isRetryableGatewayStatus(status: number): boolean {
    return status === 502 || status === 503 || status === 504;
  }

  /**
   * Executes request with automatic OAuth2 refresh on 401, retry on connection drop
   * and on gateway responses 502/503/504.
   * Single retry point; doRequest must use this.authHeaders().
   */
  private async requestWithAuthRetry<T>(
    label: string,
    doRequest: () => Promise<AxiosResponse<T>>,
    connectionRetries = 2,
    gatewayRetries = 2
  ): Promise<AxiosResponse<T>> {
    const totalGatewayAttempts = gatewayRetries + 1;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= connectionRetries; attempt++) {
      try {
        let res: AxiosResponse<T>;
        try {
          res = await doRequest();
        } catch (err: unknown) {
          if (isAxiosError(err) && err.response?.status === 401) {
            debug(`${label} 401, refreshing OAuth2`);
            await this.refreshSession();
            return doRequest();
          }
          // Axios throws on 4xx/5xx; on 502/503/504 retry after pause
          const status = isAxiosError(err) ? err.response?.status : undefined;
          if (status !== undefined && GarminClient.isRetryableGatewayStatus(status)) {
            for (let g = 1; g < totalGatewayAttempts; g++) {
              debug(`${label} ${status}, retry ${g}/${gatewayRetries}`);
              await new Promise((r) => setTimeout(r, 5000));
              try {
                return await doRequest();
              } catch (retryErr: unknown) {
                const retryStatus = isAxiosError(retryErr) ? retryErr.response?.status : undefined;
                if (retryStatus === undefined || !GarminClient.isRetryableGatewayStatus(retryStatus)) {
                  throw retryErr;
                }
                lastErr = retryErr;
              }
            }
            throw err;
          }
          throw err;
        }
        if (res.status === 401) {
          debug(`${label} 401, refreshing OAuth2`);
          await this.refreshSession();
          return doRequest();
        }
        if (GarminClient.isRetryableGatewayStatus(res.status)) {
          for (let g = 1; g < totalGatewayAttempts; g++) {
            debug(`${label} ${res.status}, retry ${g}/${gatewayRetries}`);
            await new Promise((r) => setTimeout(r, 5000));
            const retryRes = await doRequest();
            if (retryRes.status < 400 || !GarminClient.isRetryableGatewayStatus(retryRes.status)) {
              return retryRes;
            }
            res = retryRes;
          }
        }
        return res;
      } catch (err: unknown) {
        lastErr = err;
        if (
          attempt < connectionRetries &&
          GarminClient.isRetryableNetworkError(err)
        ) {
          debug(`${label} connection error, retry ${attempt + 1}/${connectionRetries}`, {
            code: (err as { code?: string }).code,
          });
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  /**
   * REST request to Connect API (GET/POST, etc.).
   * Path without leading slash or with it, e.g. /userprofile-service/socialProfile.
   *
   * @param path — API path (e.g. /wellness-service/wellness/dailyStress/2025-02-14)
   * @param method — HTTP method (default GET)
   * @param body — request body (for POST/PUT); pass string for form-urlencoded, object for JSON,
   *               for multipart — object with _multipart (Buffer) and _contentType (string) fields
   * @returns Parsed JSON or null on 204
   */
  async connectapi(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown> | string
  ): Promise<unknown> {
    await this.ensureValidSession();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl()}${normalizedPath}`;
    debug('connectapi', { method, path: normalizedPath });

    const doRequest = async (): Promise<AxiosResponse<unknown>> => {
      const headers: Record<string, string> = { ...this.authHeaders() };
      const opts = { url, method, headers, timeout: this.requestTimeoutMs };
      if (body !== undefined && method !== 'GET') {
        if (typeof body === 'string') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          return axios.request({ ...opts, data: body });
        }
        // Support multipart/form-data via special fields
        if ('_multipart' in body && '_contentType' in body) {
          headers['Content-Type'] = body['_contentType'] as string;
          return axios.request({ ...opts, data: body['_multipart'] });
        }
        headers['Content-Type'] = 'application/json';
        return axios.request({ ...opts, data: body ?? {} });
      }
      return axios.request(opts);
    };

    const res = await this.requestWithAuthRetry('connectapi', doRequest);
    debug('connectapi response', { status: res.status, path: normalizedPath });
    if (res.status >= 400) {
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      throw new Error(`Connect API ${res.status}: ${text}`);
    }
    if (res.status === 204) return null;
    return res.data as unknown;
  }

  /**
   * Downloads a resource by API path (response body as Buffer).
   */
  async download(path: string): Promise<Buffer> {
    await this.ensureValidSession();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl()}${normalizedPath}`;
    debug('download', { path: normalizedPath });

    const doRequest = (): Promise<AxiosResponse<ArrayBuffer>> =>
      axios.request({
        url,
        method: 'GET',
        headers: this.authHeaders(),
        responseType: 'arraybuffer',
        timeout: this.requestTimeoutMs,
      });

    const res = await this.requestWithAuthRetry('download', doRequest);
    debug('download response', { status: res.status, path: normalizedPath });
    if (res.status >= 400) {
      throw new Error(`Download ${res.status}: ${String(res.data)}`);
    }
    return Buffer.from(res.data);
  }

  /**
   * GraphQL request (endpoint per Garmin docs: graphql-gateway or connect).
   *
   * @param query — query string or object { query, variables }
   */
  async queryGarminGraphql(
    query: string | { query: string; variables?: Record<string, unknown> }
  ): Promise<unknown> {
    await this.ensureValidSession();
    const payload = typeof query === 'string' ? { query } : { query: query.query, variables: query.variables };
    const path = GRAPHQL;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl()}${normalizedPath}`;
    debug('queryGarminGraphql', { queryLength: typeof query === 'string' ? query.length : query.query.length });

    const doRequest = (): Promise<AxiosResponse<unknown>> =>
      axios.request({
        url,
        method: 'POST',
        headers: { ...this.authHeaders(), 'Content-Type': 'application/json' },
        data: payload,
        timeout: this.requestTimeoutMs,
      });

    const res = await this.requestWithAuthRetry('queryGarminGraphql', doRequest);
    debug('queryGarminGraphql response', { status: res.status });
    if (res.status >= 400) {
      throw new Error(`GraphQL ${res.status}: ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }
}
