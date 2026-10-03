import type { BudgetCell } from '../../../../../data/domains/budget-cell/budget-cell';
import type { CategoryType } from '../../../../../data/domains/category/category';
import type { PeriodTotals } from '../../../../../data/lib/period-balance';
import { PLAN_MONTHS } from '../../plan-amount-grid/constants';

/** Minimal category shape needed to bucket cells by type and skip hidden categories. */
interface TotalsCategoryRef {
  id: string;
  type: CategoryType;
  active: boolean;
}

const EMPTY_TOTALS = (): PeriodTotals => ({
  incomeCents: 0,
  expenseCents: 0,
  savingsCents: 0,
});

/**
 * Build Jan–Dec period totals from sparse budget cells.
 * Inactive categories are skipped (same rule as section totals).
 * Missing cells count as 0.
 */
export function periodTotalsByMonth(
  cells: readonly Pick<BudgetCell, 'categoryId' | 'month' | 'amountCents'>[],
  categories: readonly TotalsCategoryRef[],
): PeriodTotals[] {
  const typeById = new Map<string, CategoryType>();
  for (const category of categories) {
    if (category.active) {
      typeById.set(category.id, category.type);
    }
  }

  const totals = PLAN_MONTHS.map(EMPTY_TOTALS);

  for (const cell of cells) {
    const type = typeById.get(cell.categoryId);
    if (!type) {
      continue;
    }
    const bucket = totals[cell.month - 1];
    if (type === 'income') {
      bucket.incomeCents += cell.amountCents;
    } else if (type === 'expense') {
      bucket.expenseCents += cell.amountCents;
    } else {
      bucket.savingsCents += cell.amountCents;
    }
  }

  return totals;
}
