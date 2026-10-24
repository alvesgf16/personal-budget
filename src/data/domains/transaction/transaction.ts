import { z } from 'zod';
import { categoryTypeSchema } from '../../lib/category-type';

/**
 * Logged money movement for Tracking. Amounts are positive integer cents.
 * Effective date and running balance are computed later, not stored here.
 */
export const transactionSchema = z.object({
  date: z.iso.date(),
  type: categoryTypeSchema,
  categoryId: z.string().min(1),
  amountCents: z.number().int().positive().safe(),
  details: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;
