import type { TotalableCategory } from '../types';
import { yearTotalCents } from './year-total-cents';

export function sectionYearTotalCents(
  amounts: Record<string, number>,
  categories: readonly TotalableCategory[],
): number {
  let total = 0;

  for (const category of categories) {
    if (!category.active) {
      continue;
    }

    total += yearTotalCents(amounts, category.id);
  }

  return total;
}
