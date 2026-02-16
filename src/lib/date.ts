/**
 * Parse date in YYYY-MM-DD format.
 * Returns today's date by default (in local timezone).
 *
 * Returns date string in YYYY-MM-DD format.
 * @param input — YYYY-MM-DD string or empty/undefined for "today"
 * @returns date in YYYY-MM-DD format
 * @throws Error if input is provided and is not a valid YYYY-MM-DD date
 */
export function parseDate(input?: string): string {
  if (input === undefined || input === '') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid date format: expected YYYY-MM-DD, got: ${input}`);
  }
  const [, year, month, day] = match;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    throw new Error(`Invalid date: ${input}`);
  }
  return `${year}-${month}-${day}`;
}

/**
 * Adds N days to a date. Date in YYYY-MM-DD format.
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Week (Mon-Sun) containing the given date. Like in HAR: fromDate/untilDate are Monday and Sunday.
 */
export function getWeekRange(dateStr: string): { fromDate: string; untilDate: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const fromDate = addDays(dateStr, -daysSinceMonday);
  const untilDate = addDays(fromDate, 6);
  return { fromDate, untilDate };
}
