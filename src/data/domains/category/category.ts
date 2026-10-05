import { z } from 'zod';

export const categoryTypeSchema = z.enum(['income', 'expense', 'savings']);

export type CategoryType = z.infer<typeof categoryTypeSchema>;

/**
 * Category payload (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 */
export const categorySchema = z.object({
  type: categoryTypeSchema,
  name: z.string().trim().min(1),
  sortOrder: z.number().int(),
  /** false means hidden from the active grid; history stays. */
  active: z.boolean(),
});

export type Category = z.infer<typeof categorySchema>;

export function parseCategoryName(raw: string): string | null {
  const parsed = categorySchema.shape.name.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
