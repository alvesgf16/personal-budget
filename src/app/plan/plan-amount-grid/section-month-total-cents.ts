import { cellKey } from './helpers';
import type { TotalableRow } from './types';

/** Sum of active categories for one month. Hidden rows are skipped. */
export function sectionMonthTotalCents(
  amounts: Record<string, number>,
  rows: readonly TotalableRow[],
  month: number,
): number {
  let total = 0;
  for (const row of rows) {
    if (!row.active) {
      continue;
    }
    total += amounts[cellKey(row.id, month)] ?? 0;
  }
  return total;
}
