/** Lookup key for one category × month amount. */
export function cellKey(categoryId: string, month: number): string {
  return `${categoryId}:${month}`;
}
