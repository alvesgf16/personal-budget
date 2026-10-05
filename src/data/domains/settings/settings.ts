import { z } from 'zod';
import { planYearSchema } from '../../lib/plan-year';

/**
 * App settings payload (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 */
export const settingsSchema = z.object({
  /** Calendar year that drives the Plan year header. */
  startingYear: planYearSchema,
});

export type Settings = z.infer<typeof settingsSchema>;

export function parseSettings(raw: string): Settings | null {
  const trimmed = raw.trim();
  const parsed = settingsSchema.safeParse({
    startingYear: trimmed === '' ? Number.NaN : Number(trimmed),
  });
  return parsed.success ? parsed.data : null;
}
