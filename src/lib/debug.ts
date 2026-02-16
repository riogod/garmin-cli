/**
 * Debug output utility.
 * Enabled by CLI flag --debug (sets GARMIN_DEBUG) or env GARMIN_DEBUG=1.
 * Output goes to stderr with [debug] prefix so it does not mix with JSON on stdout.
 */

/** Whether debug mode is enabled (--debug or GARMIN_DEBUG=1/true). */
export function isDebugEnabled(): boolean {
  const v = process.env.GARMIN_DEBUG;
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Writes a debug message to stderr when debug mode is enabled.
 * @param msg — Short step description (e.g. "SSO embed", "preauthorized 200")
 * @param data — Optional data to log (objects are JSON stringified; do not log sensitive fields)
 */
export function debug(msg: string, ...data: unknown[]): void {
  if (!isDebugEnabled()) return;
  const parts = ['[debug]', msg];
  for (const d of data) {
    if (d === undefined) continue;
    if (typeof d === 'object' && d !== null) {
      try {
        parts.push(JSON.stringify(d));
      } catch {
        parts.push(String(d));
      }
    } else {
      parts.push(String(d));
    }
  }
  console.error(parts.join(' '));
}
