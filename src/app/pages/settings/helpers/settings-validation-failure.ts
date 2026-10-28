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
import type { SettingsFormField } from '../types';

interface SettingsValidationFailure {
  field: SettingsFormField;
  message: string;
}

export function settingsValidationFailure(input: ParseSettingsInput): SettingsValidationFailure {
  return (
    startingYearFailure(input) ??
    lateIncomeShiftFailure(input) ??
    startingDayFailure(input) ??
    unreachableSettingsFailure()
  );
}

function startingYearFailure(input: ParseSettingsInput): SettingsValidationFailure | null {
  if (planYearSchema.safeParse(numberFromTrimmed(input.startingYear)).success) {
    return null;
  }

  return {
    field: 'startingYear',
    message: `Enter a whole year between ${PLAN_YEAR_MIN} and ${PLAN_YEAR_MAX}.`,
  };
}

function lateIncomeShiftFailure(input: ParseSettingsInput): SettingsValidationFailure | null {
  if (lateIncomeShiftSchema.safeParse(input.lateIncomeShift).success) {
    return null;
  }

  return {
    field: 'lateIncomeShift',
    message: 'Choose Active or Inactive for late monthly income.',
  };
}

function startingDayFailure(input: ParseSettingsInput): SettingsValidationFailure | null {
  if (
    lateIncomeShiftStartingDaySchema.safeParse(numberFromTrimmed(input.lateIncomeShiftStartingDay))
      .success
  ) {
    return null;
  }

  return {
    field: 'lateIncomeShiftStartingDay',
    message: `Enter a whole day between ${LATE_INCOME_SHIFT_STARTING_DAY_MIN} and ${LATE_INCOME_SHIFT_STARTING_DAY_MAX}.`,
  };
}

function unreachableSettingsFailure(): never {
  throw new Error('Settings form was invalid but no field message matched.');
}
