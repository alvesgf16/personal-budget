import { z } from 'zod';

/** Allowed category kinds on the Plan (income / expense / savings). */
export const categoryTypeSchema = z.enum(['income', 'expense', 'savings']);

export type CategoryType = z.infer<typeof categoryTypeSchema>;

/**
 * Category payload (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 */
export const categorySchema = z.object({
  type: categoryTypeSchema,
  /** Display name; whitespace-only is rejected. */
  name: z.string().trim().min(1),
  /** Stable order for the Plan grid and later Tracking dropdowns. */
  sortOrder: z.number().int(),
  /** false means hidden from the active grid (PB-60); history stays. */
  active: z.boolean(),
});

/** Inferred TypeScript type — one source of truth with the Zod schema. */
export type Category = z.infer<typeof categorySchema>;
