/**
 * Parse a dollar amount typed in the Plan grid into integer cents.
 * Empty / whitespace → `null` (caller soft-deletes the sparse cell).
 * Rejects negatives, more than two decimal places, and non-numeric input.
 */
export function dollarsToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error('Enter a non-negative dollar amount.');
  }
  const [wholePart, fracPart = ''] = trimmed.split('.');
  const amountCents = Number(wholePart) * 100 + Number(fracPart.padEnd(2, '0'));
  if (!Number.isSafeInteger(amountCents)) {
    throw new Error('Amount is too large.');
  }
  return amountCents;
}
