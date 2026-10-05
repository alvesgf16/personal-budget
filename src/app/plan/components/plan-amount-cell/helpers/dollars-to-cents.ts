/**
 * Parse a dollar amount typed in the Plan grid into integer cents.
 * Empty / whitespace → `null` (caller soft-deletes the sparse cell).
 */
export function dollarsToCents(dollarInput: string): number | null {
  const amountDollars = dollarInput.trim();

  if (amountDollars === '') {
    return null;
  }

  return centsFromDollarAmount(amountDollars);
}

function centsFromDollarAmount(amountDollars: string): number {
  requireValidDollarShape(amountDollars);

  const amountCents = toCents(amountDollars);

  requireSafeCents(amountCents);

  return amountCents;
}

function requireValidDollarShape(amountDollars: string): void {
  const dollarAmountPattern = /^\d+(\.\d{1,2})?$/;

  if (dollarAmountPattern.test(amountDollars)) {
    return;
  }

  throw new Error('Enter a non-negative dollar amount.');
}

function toCents(amountDollars: string): number {
  const [wholePart, fractionalPart = ''] = amountDollars.split('.');

  return Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));
}

function requireSafeCents(amountCents: number): void {
  if (Number.isSafeInteger(amountCents)) {
    return;
  }

  throw new Error('Amount is too large.');
}
