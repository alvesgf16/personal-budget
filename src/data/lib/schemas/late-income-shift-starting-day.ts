import { z } from 'zod';

export const LATE_INCOME_SHIFT_STARTING_DAY_MIN = 1;
export const LATE_INCOME_SHIFT_STARTING_DAY_MAX = 31;

export const lateIncomeShiftStartingDaySchema = z
  .number()
  .int()
  .min(LATE_INCOME_SHIFT_STARTING_DAY_MIN)
  .max(LATE_INCOME_SHIFT_STARTING_DAY_MAX);
