/**
 * Parse a dollar amount typed in the Plan grid into integer cents.
 * Empty / whitespace → `empty` (caller soft-deletes the sparse cell).
 */
export type DollarAmountParse =
  | { status: 'empty' }
  | { status: 'ok'; amountCents: number }
  | { status: 'invalid'; message: string };

export function parseDollarAmount(dollarInput: string): DollarAmountParse {
  const amountDollars = dollarInput.trim();

  if (amountDollars === '') {
    return { status: 'empty' };
  }

  return centsFromDollarAmount(amountDollars);
}

function centsFromDollarAmount(amountDollars: string): DollarAmountParse {
  if (!isValidDollarShape(amountDollars)) {
    return { status: 'invalid', message: 'Enter a non-negative dollar amount.' };
  }

  const amountCents = toCents(amountDollars);

  if (!Number.isSafeInteger(amountCents)) {
    return { status: 'invalid', message: 'Amount is too large.' };
  }

  return { status: 'ok', amountCents };
}

function isValidDollarShape(amountDollars: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(amountDollars);
}

function toCents(amountDollars: string): number {
  const [wholePart, fractionalPart = ''] = amountDollars.split('.');

  return Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));
}
