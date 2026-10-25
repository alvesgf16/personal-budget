import { z } from 'zod';
import { categoryTypeSchema } from '../../lib/schemas/category-type';

export const categorySchema = z.object({
  type: categoryTypeSchema,
  name: z.string().trim().min(1),
  sortOrder: z.number().int(),
  /** Hidden from the active grid; history stays. */
  active: z.boolean(),
});

export type Category = z.infer<typeof categorySchema>;

export function parseCategoryName(unparsedName: string): string | null {
  const parsed = categorySchema.shape.name.safeParse(unparsedName);

  return parsed.success ? parsed.data : null;
}
