import { z } from 'zod';
import { planYearSchema } from '../../lib/plan-year';

export const settingsSchema = z.object({
  /** Calendar year that drives the Plan year header. */
  startingYear: planYearSchema,
});

export type Settings = z.infer<typeof settingsSchema>;

export function parseSettings(unparsedYear: string): Settings | null {
  const startingYearString = unparsedYear.trim();

  const parsed = settingsSchema.safeParse({
    startingYear: startingYearString === '' ? Number.NaN : Number(startingYearString),
  });

  return parsed.success ? parsed.data : null;
}
