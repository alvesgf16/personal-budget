import { z } from 'zod';
import { planYearSchema } from '../../lib/schemas/plan-year';
import { shiftLateIncomeSchema } from '../../lib/schemas/shift-late-income';

export const settingsSchema = z.object({
  /** Calendar year that drives the Plan year header. */
  startingYear: planYearSchema,
  /** When active, income on or after the starting day counts toward the next month. */
  shiftLateIncome: shiftLateIncomeSchema.default('inactive'),
  /** Calendar day (1–31) that starts the late-income shift window. */
  shiftLateIncomeStartingDay: z.number().int().min(1).max(31).default(1),
});

export type Settings = z.infer<typeof settingsSchema>;

export function parseSettings(unparsedYear: string): Settings | null {
  const startingYearString = unparsedYear.trim();

  const parsed = settingsSchema.safeParse({
    startingYear: startingYearString === '' ? Number.NaN : Number(startingYearString),
  });

  return parsed.success ? parsed.data : null;
}
