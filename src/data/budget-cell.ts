import { z } from 'zod';

/**
 * One planned amount for a category in a calendar month (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 *
 * Sparse: a missing cell means “no amount entered,” not a stored zero.
 * Amounts are integer cents so later UI never does float math.
 */
export const budgetCellSchema = z.object({
  /** Category document id this cell belongs to. */
  categoryId: z.string().min(1),
  /** Plan year (same bounds as settings.startingYear). */
  year: z.number().int().min(1900).max(2100),
  /** Calendar month 1–12. */
  month: z.number().int().min(1).max(12),
  /** Planned amount in integer cents (non-negative, within Number.MAX_SAFE_INTEGER). */
  amountCents: z.number().int().nonnegative().safe(),
});

/** Inferred TypeScript type — one source of truth with the Zod schema. */
export type BudgetCell = z.infer<typeof budgetCellSchema>;

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
