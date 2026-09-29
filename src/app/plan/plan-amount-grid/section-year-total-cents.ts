import type { TotalableRow } from './types';
import { yearTotalCents } from './year-total-cents';

/** Sum of active category year totals (equals the twelve section month totals). */
export function sectionYearTotalCents(
  amounts: Record<string, number>,
  rows: readonly TotalableRow[],
): number {
  let total = 0;
  for (const row of rows) {
    if (!row.active) {
      continue;
    }
    total += yearTotalCents(amounts, row.id);
  }
  return total;
}
