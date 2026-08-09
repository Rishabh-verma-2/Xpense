/** Generates a UUID-like unique ID without external dependencies */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 9);
  return `${timestamp}_${rand}`;
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAmount(value: string | number): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return { valid: false, error: 'Please enter a valid amount' };
  if (num <= 0) return { valid: false, error: 'Amount must be greater than 0' };
  if (num > 999_999_999.99) return { valid: false, error: 'Amount is too large' };
  const decimalStr = num.toString().split('.')[1];
  if (decimalStr && decimalStr.length > 2) {
    return { valid: false, error: 'Maximum 2 decimal places allowed' };
  }
  return { valid: true };
}

export function validateDate(dateStr: string, allowFuture = false): ValidationResult {
  if (!dateStr) return { valid: false, error: 'Date is required' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { valid: false, error: 'Invalid date' };
  if (!allowFuture) {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (d > now) return { valid: false, error: 'Date cannot be in the future' };
  }
  return { valid: true };
}

export function validateNotes(notes: string): ValidationResult {
  if (notes.length > 500) {
    return { valid: false, error: 'Notes must be 500 characters or less' };
  }
  return { valid: true };
}

export function validateCategoryName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, error: 'Category name is required' };
  if (name.trim().length > 30) {
    return { valid: false, error: 'Category name must be 30 characters or less' };
  }
  return { valid: true };
}
