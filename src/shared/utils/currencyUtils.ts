/**
 * Formats a number as currency for display.
 * Uses the provided currency code (defaults to INR).
 * Completely safe against NaN, undefined, or RangeError.
 */
export function formatCurrency(
  amount?: number | null,
  currencyCode = 'INR',
  currencySymbol = '₹',
): string {
  const safeNum = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? Math.abs(amount) : 0;
  
  try {
    const formatted = safeNum.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currencySymbol}${formatted}`;
  } catch {
    // Fallback if Intl / toLocaleString fails
    const parts = safeNum.toFixed(2).split('.');
    return `${currencySymbol}${parts[0]}.${parts[1] || '00'}`;
  }
}

/**
 * Abbreviates large amounts e.g. ₹12,40,000 → ₹12.4L
 */
export function abbreviateAmount(amount?: number | null, currencySymbol = '₹'): string {
  const absAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? Math.abs(amount) : 0;
  
  if (absAmount >= 10_000_000) {
    return `${currencySymbol}${(absAmount / 10_000_000).toFixed(1)}Cr`;
  }
  if (absAmount >= 100_000) {
    return `${currencySymbol}${(absAmount / 100_000).toFixed(1)}L`;
  }
  if (absAmount >= 1_000) {
    return `${currencySymbol}${(absAmount / 1_000).toFixed(1)}K`;
  }
  return `${currencySymbol}${absAmount.toFixed(2)}`;
}

/**
 * Smart format: use abbreviation if ≥7 digits, else full format
 */
export function smartFormatCurrency(
  amount?: number | null,
  currencySymbol = '₹',
): string {
  const val = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;
  if (Math.abs(val) >= 1_000_000) {
    return abbreviateAmount(val, currencySymbol);
  }
  return formatCurrency(val, 'INR', currencySymbol);
}
