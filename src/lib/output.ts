/**
 * Data output: JSON (for --json) or human-readable text.
 * Respects NO_COLOR / FORCE_COLOR for color disabling.
 */

import kleur from 'kleur';

const noColor = process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '';
const forceColor = process.env.FORCE_COLOR === '1' || process.env.FORCE_COLOR === 'true';
const useColors = forceColor || (!noColor && process.stdout?.isTTY);

/**
 * Prints data to stdout: single-line JSON in jsonMode, otherwise formatted text.
 * @param data - arbitrary data (object, array, primitive)
 * @param jsonMode - true for JSON.stringify output, false for human-readable format
 */
export function print(data: unknown, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(data));
    return;
  }
  printHuman(data);
}

/**
 * Prints data in human-readable format (recursive field traversal).
 */
function printHuman(data: unknown, indent = 0): void {
  const pad = '  '.repeat(indent);
  if (data === null) {
    console.log(`${pad}${useColors ? kleur.gray('null') : 'null'}`);
    return;
  }
  if (typeof data !== 'object') {
    const value = String(data);
    console.log(`${pad}${useColors && typeof data === 'string' ? kleur.green(value) : value}`);
    return;
  }
  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        console.log(`${pad}[${i}]:`);
        printHuman(item, indent + 1);
      } else {
        console.log(`${pad}[${i}]: ${JSON.stringify(item)}`);
      }
    });
    return;
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      console.log(`${pad}${key}:`);
      printHuman(value, indent + 1);
    } else {
      const str = value === undefined ? 'undefined' : String(value);
      console.log(`${pad}${key}: ${useColors && typeof value === 'string' ? kleur.green(str) : str}`);
    }
  }
}
