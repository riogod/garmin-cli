/**
 * Interactive console input (TTY). Prompts go to stderr.
 */

import { createInterface } from "node:readline";

/** Prompts user for one line (prompt in stderr). */
export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** Prompts for password (for scripts, GARMIN_PASSWORD is preferred). */
export function promptPassword(question: string): Promise<string> {
  return prompt(question);
}