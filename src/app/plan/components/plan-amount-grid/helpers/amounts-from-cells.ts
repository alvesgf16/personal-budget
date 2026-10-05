import { cellKey } from './cell-key';

interface AmountCellRef {
  categoryId: string;
  month: number;
  amountCents: number;
}

export function amountsFromCells(cells: readonly AmountCellRef[]): Record<string, number> {
  const amounts: Record<string, number> = {};
  for (const cell of cells) {
    amounts[cellKey(cell.categoryId, cell.month)] = cell.amountCents;
  }
  return amounts;
}
