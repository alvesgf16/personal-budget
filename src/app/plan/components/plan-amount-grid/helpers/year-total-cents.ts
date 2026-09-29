import { cellKey } from './cell-key';
import { PLAN_MONTHS } from '../constants';

/** Sum of twelve months for one category. Missing months are 0. */
export function yearTotalCents(amounts: Record<string, number>, categoryId: string): number {
  let total = 0;
  for (const month of PLAN_MONTHS) {
    total += amounts[cellKey(categoryId, month)] ?? 0;
  }
  return total;
}
