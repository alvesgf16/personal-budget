import { numberFromTrimmed } from '../../../../data/lib/number-from-trimmed';
import {
  PLAN_YEAR_MAX,
  PLAN_YEAR_MIN,
  planYearSchema,
} from '../../../../data/lib/schemas/plan-year';
import { lateIncomeShiftSchema } from '../../../../data/lib/schemas/late-income-shift';
import {
  LATE_INCOME_SHIFT_STARTING_DAY_MAX,
  LATE_INCOME_SHIFT_STARTING_DAY_MIN,
  lateIncomeShiftStartingDaySchema,
} from '../../../../data/lib/schemas/late-income-shift-starting-day';
import type { ParseSettingsInput } from '../../../../data/domains/settings/settings';

export function invalidSettingsMessage(input: ParseSettingsInput): string {
  if (!planYearSchema.safeParse(numberFromTrimmed(input.startingYear)).success) {
    return `Enter a whole year between ${PLAN_YEAR_MIN} and ${PLAN_YEAR_MAX}.`;
  }

  if (!lateIncomeShiftSchema.safeParse(input.lateIncomeShift).success) {
    return 'Choose Active or Inactive for late monthly income.';
  }

  if (
    !lateIncomeShiftStartingDaySchema.safeParse(numberFromTrimmed(input.lateIncomeShiftStartingDay))
      .success
  ) {
    return `Enter a whole day between ${LATE_INCOME_SHIFT_STARTING_DAY_MIN} and ${LATE_INCOME_SHIFT_STARTING_DAY_MAX}.`;
  }

  throw new Error('Settings form was invalid but no field message matched.');
}
