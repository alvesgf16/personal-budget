import { buildCellKey } from './build-cell-key';

interface CommittedCell {
  categoryId: string;
  month: number;
  amountCents: number | null;
}

export function buildAmountsWithCommittedCell(
  amounts: Record<string, number>,
  cell: CommittedCell,
): Record<string, number> {
  const next = { ...amounts };
  const key = buildCellKey(cell.categoryId, cell.month);

  if (cell.amountCents === null) {
    delete next[key];
  } else {
    next[key] = cell.amountCents;
  }

  return next;
}
