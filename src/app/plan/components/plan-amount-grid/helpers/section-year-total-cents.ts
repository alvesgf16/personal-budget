import type { TotalableCategory } from '../types';
import { yearTotalCents } from './year-total-cents';

/** Sum of active category year totals (equals the twelve section month totals). */
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
