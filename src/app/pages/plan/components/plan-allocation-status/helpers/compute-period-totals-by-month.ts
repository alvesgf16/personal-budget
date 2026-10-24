import type { BudgetCell } from '../../../../../../data/domains/budget-cell/budget-cell';
import type { CategoryType } from '../../../../../../data/domains/category/category';
import type { PeriodTotals } from '../../../../../../data/lib/period-balance';
import type { CategoryRef } from '../../../category-ref';
import { filterActiveCategories } from '../../../sum-over-active-categories';
import { PLAN_MONTHS } from '../../plan-amount-grid/constants';

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
export function computePeriodTotalsByMonth(
  cells: readonly Pick<BudgetCell, 'categoryId' | 'month' | 'amountCents'>[],
  categories: readonly CategoryRef[],
): PeriodTotals[] {
  const typeById = activeTypeById(categories);
  const totals = PLAN_MONTHS.map(EMPTY_TOTALS);

  for (const cell of cells) {
    addCellAmount(totals, typeById.get(cell.categoryId), cell);
  }

  return totals;
}

function activeTypeById(categories: readonly CategoryRef[]): Map<string, CategoryType> {
  const typeById = new Map<string, CategoryType>();

  for (const category of filterActiveCategories(categories)) {
    typeById.set(category.id, category.type);
  }

  return typeById;
}

function addCellAmount(
  totals: PeriodTotals[],
  type: CategoryType | undefined,
  cell: Pick<BudgetCell, 'month' | 'amountCents'>,
): void {
  if (!type) {
    return;
  }

  addToBucket(totals[cell.month - 1], type, cell.amountCents);
}

function addToBucket(bucket: PeriodTotals, type: CategoryType, amountCents: number): void {
  if (type === 'income') {
    bucket.incomeCents += amountCents;
  } else if (type === 'expense') {
    bucket.expenseCents += amountCents;
  } else {
    bucket.savingsCents += amountCents;
  }
}
