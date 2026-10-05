import { z } from 'zod';
import { planYearSchema } from '../../lib/plan-year';

/**
 * One planned amount for a category in a calendar month (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 *
 * Sparse: a missing cell means “no amount entered,” not a stored zero.
 * Amounts are integer cents so later UI never does float math.
 */
export const budgetCellSchema = z.object({
  categoryId: z.string().min(1),
  year: planYearSchema,
  month: z.number().int().min(1).max(12),
  amountCents: z.number().int().nonnegative().safe(),
});

export type BudgetCell = z.infer<typeof budgetCellSchema>;

/**
 * A cell the user is still editing in the Plan grid/form.
 * `amountCents === null` means no amount yet (or clear on save).
 */
export type EditableBudgetCell = Omit<BudgetCell, 'amountCents'> & {
  amountCents: number | null;
};
