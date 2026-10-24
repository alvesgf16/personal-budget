import { z } from 'zod';
import { planYearSchema } from '../../lib/schemas/plan-year';

/**
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

/** `amountCents === null` means no amount yet (or clear on save). */
export type EditableBudgetCell = Omit<BudgetCell, 'amountCents'> & {
  amountCents: number | null;
};
