/**
 * Authentication command group: login, logout.
 */

import type { CliProgram } from '../../cli-types.js';
import { registerLogin } from './login.js';
import { registerLogout } from './logout.js';

export function registerAuth(program: CliProgram): void {
  registerLogin(program);
  registerLogout(program);
}

export { registerLogin } from './login.js';
export { registerLogout, logoutAction } from './logout.js';
