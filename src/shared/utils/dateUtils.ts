// ── Date Utilities ──────────────────────────────────────────────────────────

/**
 * Safely parses any date input into a valid Date object.
 * Falls back to new Date() if invalid.
 */
export function parseSafeDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Returns YYYY-MM string for a given Date or ISO string
 */
export function getMonthKey(date?: Date | string | null): string {
  const d = parseSafeDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns YYYY string
 */
export function getYearKey(date?: Date | string | null): string {
  const d = parseSafeDate(date);
  return String(d.getFullYear());
}

export function isToday(date?: Date | string | null): boolean {
  const d = parseSafeDate(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(date?: Date | string | null): boolean {
  const d = parseSafeDate(date);
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
export function getDateGroupLabel(isoDate?: string | null): string {
  if (!isoDate) return 'Today';
  if (isToday(isoDate)) return 'Today';
  if (isYesterday(isoDate)) return 'Yesterday';
  const d = parseSafeDate(isoDate);
  try {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return `${d.getDate()} ${d.getMonth() + 1} ${d.getFullYear()}`;
  }
}

/**
 * Formats a date for display in a transaction row
 */
export function formatTransactionDate(isoDate?: string | null): string {
  if (!isoDate) return 'Today';
  const d = parseSafeDate(isoDate);
  try {
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (isToday(isoDate)) return `Today, ${timeStr}`;
    if (isYesterday(isoDate)) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${timeStr}`;
  } catch {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

/**
 * Returns the human-readable month + year label e.g. "August 2026"
 */
export function getMonthLabel(monthKey?: string | null): string {
  if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) {
    const now = new Date();
    try {
      return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return 'Current Month';
    }
  }

  const parts = monthKey.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || (new Date().getMonth() + 1);
  const d = new Date(year, month - 1, 1);

  if (isNaN(d.getTime())) {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  try {
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[month - 1] || 'Month'} ${year}`;
  }
}

/**
 * Navigates month key by delta (e.g. -1 = previous month)
 */
export function shiftMonth(monthKey: string | undefined | null, delta: number): string {
  if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) {
    const d = new Date();
    d.setMonth(d.getMonth() + delta);
    return getMonthKey(d);
  }
  const parts = monthKey.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || (new Date().getMonth() + 1);
  const d = new Date(year, month - 1 + delta, 1);
  return getMonthKey(d);
}

/**
 * Navigates year key by delta
 */
export function shiftYear(yearKey: string | undefined | null, delta: number): string {
  const y = Number(yearKey) || new Date().getFullYear();
  return String(y + delta);
}

/**
 * Groups an array of items by date using a key extractor.
 * Returns an array of { title, data } sections.
 */
export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): { title: string; data: T[] }[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!item) continue;
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
export function startOfMonth(monthKey?: string | null): string {
  if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }
  const parts = monthKey.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || (new Date().getMonth() + 1);
  return new Date(year, month - 1, 1).toISOString();
}

/**
 * Returns ISO string for end of a given month key
 */
export function endOfMonth(monthKey?: string | null): string {
  if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  }
  const parts = monthKey.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || (new Date().getMonth() + 1);
  return new Date(year, month, 0, 23, 59, 59, 999).toISOString();
}
