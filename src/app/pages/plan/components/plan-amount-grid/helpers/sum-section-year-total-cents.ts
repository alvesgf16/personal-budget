import type { CategoryRef } from '../../../category-ref';
import { sumYearTotalCents } from './sum-year-total-cents';

export function sumSectionYearTotalCents(
  amounts: Record<string, number>,
  categories: readonly CategoryRef[],
): number {
  let total = 0;

  for (const category of categories) {
    if (!category.active) {
      continue;
    }

    total += sumYearTotalCents(amounts, category.id);
  }

  return total;
}
