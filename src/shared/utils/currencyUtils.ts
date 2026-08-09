/**
 * Formats a number as currency for display.
 * Uses the provided currency code (defaults to INR).
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  currencySymbol = '₹',
): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formatted}`;
}

/**
 * Abbreviates large amounts e.g. ₹12,40,000 → ₹12.4L
 */
export function abbreviateAmount(amount: number, currencySymbol = '₹'): string {
  const absAmount = Math.abs(amount);
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
  amount: number,
  currencySymbol = '₹',
): string {
  if (Math.abs(amount) >= 1_000_000) {
    return abbreviateAmount(amount, currencySymbol);
  }
  return formatCurrency(amount, 'INR', currencySymbol);
}
