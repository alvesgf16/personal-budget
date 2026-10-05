import { cellKey } from './cell-key';
import type { TotalableCategory } from '../types';

export function sectionMonthTotalCents(
  amounts: Record<string, number>,
  categories: readonly TotalableCategory[],
  month: number,
): number {
  let total = 0;
  for (const category of categories) {
    if (!category.active) {
      continue;
    }
    total += amounts[cellKey(category.id, month)] ?? 0;
  }
  return total;
}
