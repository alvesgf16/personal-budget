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
  const cents = Number(wholePart) * 100 + Number(fracPart.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) {
    throw new Error('Amount is too large.');
  }
  return cents;
}

/** Format stored cents for an input value (e.g. `250000` → `"2500"` or `"2500.50"`). */
export function centsToDollarInput(amountCents: number): string {
  const whole = Math.trunc(amountCents / 100);
  const frac = Math.abs(amountCents % 100);
  if (frac === 0) {
    return String(whole);
  }
  return `${whole}.${String(frac).padStart(2, '0')}`;
}
