export function buildCellKey(categoryId: string, month: number): string {
  return `${categoryId}:${month}`;
}
