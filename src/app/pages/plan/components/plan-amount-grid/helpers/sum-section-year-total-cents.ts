import type { CategoryRef } from '../../../category-ref';
import { sumOverActiveCategories } from '../../../sum-over-active-categories';
import { sumYearTotalCents } from './sum-year-total-cents';

export function sumSectionYearTotalCents(
  amounts: Record<string, number>,
  categories: readonly CategoryRef[],
): number {
  return sumOverActiveCategories(categories, (category) => sumYearTotalCents(amounts, category.id));
}
