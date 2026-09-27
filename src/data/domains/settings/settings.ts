import { z } from 'zod';
import { planYearSchema } from '../../lib/plan-year';

/**
 * App settings payload (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 */
export const settingsSchema = z.object({
  /** Calendar year that drives the Plan year header (PB-19). */
  startingYear: planYearSchema,
});

/** Inferred TypeScript type — one source of truth with the Zod schema. */
export type Settings = z.infer<typeof settingsSchema>;

/** Parse a typed year string. Empty or out of range → `null`. */
export function parseStartingYear(raw: string): Settings | null {
  const trimmed = raw.trim();
  const parsed = settingsSchema.safeParse({
    startingYear: trimmed === '' ? Number.NaN : Number(trimmed),
  });
  return parsed.success ? parsed.data : null;
}
