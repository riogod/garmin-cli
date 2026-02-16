/**
 * Login command: sign in to Garmin Connect and save session to tokenDir.
 * Step-by-step input: email -> password -> MFA code if required.
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { prompt, promptPassword } from '../../lib/prompt.js';
import { print } from '../../lib/output.js';
import {
  AuthError,
  clearMfaState,
  loadMfaState,
  login,
  resumeLogin,
  saveMfaState,
} from '../../garmin/index.js';
import type { GarminConfig } from '../../lib/config.js';
import type { CliProgram } from '../../cli-types.js';

/** Login command options from CLI. */
export interface LoginCommandOptions {
  jsonMode: boolean;
  email?: string;
  password?: string;
}

/**
 * Gathers config for login: load config -> override from CLI -> prompt in TTY if needed.
 */
async function gatherCredentials(
  opts: LoginCommandOptions
): Promise<{ config: GarminConfig; tokenDir: string }> {
  const config = loadConfig();

  let email = opts.email ?? config.email;
  if (!email && process.stdin.isTTY) {
    email = await prompt('Email: ');
  }

  let password = opts.password ?? config.password;
  if (!password && process.stdin.isTTY) {
    password = await promptPassword('Password: ');
  }

  const tokenDir = config.tokenDir ?? '';
  const merged: GarminConfig = {
    ...config,
    email: email || config.email,
    password: password || config.password,
  };

  return { config: merged, tokenDir };
}

/**
 * Action for `garmin-cli login` command.
 * 1) Without options: prompt email -> password -> MFA if needed -> authenticate.
 * 2) With --email: prompt password -> MFA if needed -> authenticate.
 * 3) With --email and --password: MFA if needed -> authenticate.
 *
 * @param opts — jsonMode and optionally email, password from CLI
 */
export async function loginAction(opts: LoginCommandOptions): Promise<void> {
  const { jsonMode } = opts;
  try {
    const { config, tokenDir } = await gatherCredentials(opts);

    if (!config.email || !config.password) {
      const msg =
        'Email and/or password not set. Specify --email and/or --password, set GARMIN_EMAIL/GARMIN_PASSWORD or run in interactive mode.';
      if (jsonMode) {
        console.log(JSON.stringify({ ok: false, error: msg }));
      } else {
        console.error('Error:', msg);
      }
      process.exit(1);
    }

    const result = await login(config);

    if ('needsMfa' in result) {
      if (jsonMode) {
        console.log(
          JSON.stringify({
            ok: false,
            needsMfa: true,
            message: 'MFA required. Set GARMIN_MFA_CODE or run in TTY.',
          })
        );
      } else {
        console.error('MFA required. Set GARMIN_MFA_CODE or run in interactive mode.');
      }
      process.exit(1);
    }

    if (jsonMode) {
      print(
        { ok: true, tokenDir: tokenDir || undefined, domain: result.session.domain },
        true
      );
    } else {
      const where = tokenDir
        ? `Tokens saved to ${tokenDir}.`
        : 'Session obtained.';
      console.log(`Success: logged in (${result.session.domain}). ${where}`);
    }
  } catch (err) {
    const message =
      err instanceof AuthError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: message }));
    } else {
      console.error('Error:', message);
    }
    process.exit(1);
  }
}

/**
 * Action for `garmin-cli login manual login` command: step 1 of step-by-step authentication.
 * On MFA, saves state to tokenDir and outputs command for step 2.
 */
async function manualLoginAction(opts: LoginCommandOptions): Promise<void> {
  const { jsonMode } = opts;
  try {
    const { config, tokenDir } = await gatherCredentials(opts);

    if (!config.email || !config.password) {
      const msg =
        'Email and/or password not set. Specify --email and/or --password, set GARMIN_EMAIL/GARMIN_PASSWORD or run in interactive mode.';
      if (jsonMode) {
        console.log(JSON.stringify({ ok: false, error: msg }));
      } else {
        console.error('Error:', msg);
      }
      process.exit(1);
    }

    const result = await login(config, { returnOnMfa: true });

    if ('needsMfa' in result) {
      saveMfaState(tokenDir, result.needsMfa);
      const nextCommand = 'garmin-cli login manual mfa <code>';
      if (jsonMode) {
        console.log(
          JSON.stringify({
            ok: false,
            needsMfa: true,
            message: 'MFA required. Run: ' + nextCommand,
            nextCommand,
          })
        );
      } else {
        console.log('MFA required. Run:', nextCommand);
      }
      process.exit(1);
    }

    if (jsonMode) {
      print(
        { ok: true, tokenDir: tokenDir || undefined, domain: result.session.domain },
        true
      );
    } else {
      const where = tokenDir
        ? `Tokens saved to ${tokenDir}.`
        : 'Session obtained.';
      console.log(`Success: logged in (${result.session.domain}). ${where}`);
    }
  } catch (err) {
    const message =
      err instanceof AuthError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: message }));
    } else {
      console.error('Error:', message);
    }
    process.exit(1);
  }
}

/**
 * Action for `garmin-cli login manual mfa [code]` command: step 2 of step-by-step authentication.
 * Loads state from tokenDir, calls resumeLogin, deletes mfa_state on success.
 */
async function manualMfaAction(
  codeArg: string | undefined,
  opts: { json?: boolean }
): Promise<void> {
  const jsonMode = opts.json === true;
  try {
    const config = loadConfig();
    const tokenDir = config.tokenDir ?? '';

    const state = loadMfaState(tokenDir);
    if (!state) {
      const msg =
        'First run: garmin-cli login manual login --email <email> --password <password>';
      if (jsonMode) {
        console.log(JSON.stringify({ ok: false, error: msg }));
      } else {
        console.error('Error:', msg);
      }
      process.exit(1);
    }

    let code = codeArg?.trim();
    if (!code && process.stdin.isTTY) {
      code = await prompt('MFA code: ');
    }
    if (!code) {
      const msg = 'Enter MFA code: garmin-cli login manual mfa <code>';
      if (jsonMode) {
        console.log(JSON.stringify({ ok: false, error: msg }));
      } else {
        console.error('Error:', msg);
      }
      process.exit(1);
    }

    const session = await resumeLogin(state, code, tokenDir);
    clearMfaState(tokenDir);

    if (jsonMode) {
      print(
        { ok: true, tokenDir: tokenDir || undefined, domain: session.domain },
        true
      );
    } else {
      const where = tokenDir
        ? `Tokens saved to ${tokenDir}.`
        : 'Session obtained.';
      console.log(`Success: logged in (${session.domain}). ${where}`);
    }
  } catch (err) {
    const message =
      err instanceof AuthError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: message }));
    } else {
      console.error('Error:', message);
    }
    process.exit(1);
  }
}

/** Login command options from CLI (raw from Commander). */
interface LoginCmdOpts {
  email?: string;
  password?: string;
}

/**
 * Registers the `login` command in the CLI program.
 * Pattern: each command exports register(program) for uniform registration.
 */
export function registerLogin(program: CliProgram): void {
  const loginCmd = (program as Command)
    .command('login')
    .description('log in to Garmin Connect and save session')
    .option('--email <email>', 'email (if not specified, prompt in interactive mode)')
    .option('--password <password>', 'password (GARMIN_PASSWORD is preferred for scripts)')
    .action(async (_value: unknown, cmd: { opts: () => LoginCmdOpts }) => {
      const globalOpts = program.opts() as { json?: boolean };
      const loginOpts = cmd.opts();
      await loginAction({
        jsonMode: globalOpts.json === true,
        email: loginOpts.email,
        password: loginOpts.password,
      });
    });

  const manualCmd = loginCmd
    .command('manual')
    .description('step-by-step authentication (login -> on MFA save state -> mfa <code>)');

  manualCmd
    .command('login')
    .description('step 1: email and password (on MFA, state will be saved)')
    .argument('[email]', 'email (positional or --email)')
    .argument('[password]', 'password (positional or --password)')
    .option('--email <email>', 'email')
    .option('--password <password>', 'password')
    .action(
      async (
        emailArg: string | undefined,
        passwordArg: string | undefined,
        opts: LoginCmdOpts
      ) => {
        const globalOpts = program.opts() as { json?: boolean };
        await manualLoginAction({
          jsonMode: globalOpts.json === true,
          email: opts.email ?? emailArg,
          password: opts.password ?? passwordArg,
        });
      }
    );

  manualCmd
    .command('mfa [code]')
    .description('enter MFA code and complete login')
    .action(async (code: string | undefined) => {
      const globalOpts = program.opts() as { json?: boolean };
      await manualMfaAction(code, globalOpts);
    });
}
