/**
 * Logout command: delete saved session (tokens from tokenDir).
 * garmin logout
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { clearMfaState, clearTokenStore } from '../../garmin/index.js';
import type { CliProgram } from '../../cli-types.js';

function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

/**
 * Action for `garmin logout` command: deletes oauth1_token.json and oauth2_token.json from tokenDir.
 */
export async function logoutAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const tokenDir = config.tokenDir ?? '';

  if (!tokenDir) {
    const msg = 'tokenDir not set (config or GARMIN_TOKEN_DIR). Cannot determine token directory.';
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: msg }));
    } else {
      console.error('Error:', msg);
    }
    process.exit(1);
  }

  clearTokenStore(tokenDir);
  clearMfaState(tokenDir);

  if (jsonMode) {
    print({ ok: true, tokenDir }, true);
  } else {
    console.log(`Success: logged out. Tokens deleted from ${tokenDir}.`);
  }
}

/**
 * Registers the logout command in the CLI program.
 */
export function registerLogout(program: CliProgram): void {
  (program as Command)
    .command('logout')
    .description('log out from Garmin Connect (delete saved tokens from tokenDir)')
    .action(async () => {
      await logoutAction(getJsonMode(program));
    });
}
