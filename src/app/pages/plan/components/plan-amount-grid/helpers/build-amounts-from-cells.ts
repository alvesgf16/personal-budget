import type { BudgetCell } from '../../../../../../data/domains/budget-cell/budget-cell';
import { buildCellKey } from './build-cell-key';

export function buildAmountsFromCells(
  cells: readonly Pick<BudgetCell, 'categoryId' | 'month' | 'amountCents'>[],
): Record<string, number> {
  const amounts: Record<string, number> = {};

  for (const cell of cells) {
    amounts[buildCellKey(cell.categoryId, cell.month)] = cell.amountCents;
  }

  return amounts;
}
