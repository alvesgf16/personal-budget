import type { CategoryRef } from '../../../category-ref';
import { sumOverActiveCategories } from '../../../sum-over-active-categories';
import { buildCellKey } from './build-cell-key';

export function sumSectionMonthTotalCents(
  amounts: Record<string, number>,
  categories: readonly CategoryRef[],
  month: number,
): number {
  return sumOverActiveCategories(
    categories,
    (category) => amounts[buildCellKey(category.id, month)] ?? 0,
  );
}
