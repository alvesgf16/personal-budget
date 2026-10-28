import type { CategoryType } from '../schemas/category-type';
import type { LateIncomeShift } from '../schemas/late-income-shift';

export interface CalculateEffectiveDateInput {
  date: string;
  type: CategoryType;
  lateIncomeShift: LateIncomeShift;
  lateIncomeShiftStartingDay: number;
}

/**
 * Effective calendar date for Tracking. Late income on or after the shift day
 * moves to the first of the next month; otherwise the received date stands.
 */
export function calculateEffectiveDate(input: CalculateEffectiveDateInput): string {
  if (!shouldShiftToNextMonth(input)) {
    return input.date;
  }

  return firstDayOfNextMonth(input.date);
}

function shouldShiftToNextMonth(input: CalculateEffectiveDateInput): boolean {
  if (input.lateIncomeShift !== 'active' || input.type !== 'income') {
    return false;
  }

  return dayOfMonth(input.date) >= input.lateIncomeShiftStartingDay;
}

function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

function firstDayOfNextMonth(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));

  if (month === 12) {
    return `${year + 1}-01-01`;
  }

  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}
