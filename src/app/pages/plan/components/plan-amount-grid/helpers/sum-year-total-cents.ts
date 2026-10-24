import { buildCellKey } from './build-cell-key';
import { PLAN_MONTHS } from '../../../plan-months';

export function sumYearTotalCents(amounts: Record<string, number>, categoryId: string): number {
  let total = 0;

  for (const month of PLAN_MONTHS) {
    total += amounts[buildCellKey(categoryId, month)] ?? 0;
  }

  return total;
}
