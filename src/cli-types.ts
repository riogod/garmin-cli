/**
 * Common CLI types: program type for command registration (Commander-compatible).
 */
import type { Command } from "commander";

export type CliProgram = Command;

export interface GlobalCliOptions {
  json?: boolean;
  debug?: boolean;
}
