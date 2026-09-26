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
  /** Planned amount in integer cents (non-negative). */
  amountCents: z.number().int().nonnegative(),
});

/** Inferred TypeScript type — one source of truth with the Zod schema. */
export type BudgetCell = z.infer<typeof budgetCellSchema>;
