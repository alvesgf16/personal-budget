import type { CategoryRef } from '../../../category-ref';
import { buildCellKey } from './build-cell-key';

export function sumSectionMonthTotalCents(
  amounts: Record<string, number>,
  categories: readonly CategoryRef[],
  month: number,
): number {
  let total = 0;

  for (const category of categories) {
    if (!category.active) {
      continue;
    }

    total += amounts[buildCellKey(category.id, month)] ?? 0;
  }

  return total;
}
