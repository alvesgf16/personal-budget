import { cellKey } from './cell-key';

/** One stored cell used to build the grid amounts map. */
interface AmountCellRef {
  categoryId: string;
  month: number;
  amountCents: number;
}

/** Index stored cell amounts by `categoryId:month`. */
export function amountsFromCells(cells: readonly AmountCellRef[]): Record<string, number> {
  const amounts: Record<string, number> = {};
  for (const cell of cells) {
    amounts[cellKey(cell.categoryId, cell.month)] = cell.amountCents;
  }
  return amounts;
}
