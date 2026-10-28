import { z } from 'zod';
import { numberFromTrimmed } from '../../lib/number-from-trimmed';
import { planYearSchema } from '../../lib/schemas/plan-year';
import {
  LATE_INCOME_SHIFT_DEFAULT,
  lateIncomeShiftSchema,
} from '../../lib/schemas/late-income-shift';
import {
  LATE_INCOME_SHIFT_STARTING_DAY_MIN,
  lateIncomeShiftStartingDaySchema,
} from '../../lib/schemas/late-income-shift-starting-day';

export const settingsSchema = z.object({
  /** Calendar year that drives the Plan year header. */
  startingYear: planYearSchema,
  /** When active, income on or after the starting day counts toward the next month. */
  lateIncomeShift: lateIncomeShiftSchema.default(LATE_INCOME_SHIFT_DEFAULT),
  /** Calendar day that starts the late-income shift window. */
  lateIncomeShiftStartingDay: lateIncomeShiftStartingDaySchema.default(
    LATE_INCOME_SHIFT_STARTING_DAY_MIN,
  ),
});

export type Settings = z.infer<typeof settingsSchema>;

export interface ParseSettingsInput {
  startingYear: string;
  lateIncomeShift: string;
  lateIncomeShiftStartingDay: string;
}

export function parseSettings(input: ParseSettingsInput): Settings | null {
  const parsed = settingsSchema.safeParse({
    startingYear: numberFromTrimmed(input.startingYear),
    lateIncomeShift: input.lateIncomeShift,
    lateIncomeShiftStartingDay: numberFromTrimmed(input.lateIncomeShiftStartingDay),
  });

  return parsed.success ? parsed.data : null;
}
