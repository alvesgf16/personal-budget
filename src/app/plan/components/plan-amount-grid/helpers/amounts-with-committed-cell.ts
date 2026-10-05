import { cellKey } from './cell-key';

interface CommittedCell {
  categoryId: string;
  month: number;
  amountCents: number | null;
}

export function amountsWithCommittedCell(
  amounts: Record<string, number>,
  cell: CommittedCell,
): Record<string, number> {
  const next = { ...amounts };
  const key = cellKey(cell.categoryId, cell.month);

  if (cell.amountCents === null) {
    delete next[key];
  } else {
    next[key] = cell.amountCents;
  }

  return next;
}
