// ── Date Utilities ──────────────────────────────────────────────────────────

/**
 * Returns YYYY-MM string for a given Date or ISO string
 */
export function getMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns YYYY string
 */
export function getYearKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return String(d.getFullYear());
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Returns a human-readable date group label
 */
export function getDateGroupLabel(isoDate: string): string {
  if (isToday(isoDate)) return 'Today';
  if (isYesterday(isoDate)) return 'Yesterday';
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formats a date for display in a transaction row
 */
export function formatTransactionDate(isoDate: string): string {
  const d = new Date(isoDate);
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (isToday(isoDate)) return `Today, ${timeStr}`;
  if (isYesterday(isoDate)) return `Yesterday, ${timeStr}`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${timeStr}`;
}

/**
 * Returns the human-readable month + year label e.g. "August 2026"
 */
export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Navigates month key by delta (e.g. -1 = previous month)
 */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return getMonthKey(d);
}

/**
 * Navigates year key by delta
 */
export function shiftYear(yearKey: string, delta: number): string {
  return String(Number(yearKey) + delta);
}

/**
 * Groups an array of items by date using a key extractor.
 * Returns an array of { title, data } sections.
 */
export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): { title: string; data: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const label = getDateGroupLabel(getDate(item));
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

/**
 * Returns ISO string for start of today
 */
export function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Returns ISO string for start of a given month key
 */
export function startOfMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toISOString();
}

/**
 * Returns ISO string for end of a given month key
 */
export function endOfMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999).toISOString();
}
