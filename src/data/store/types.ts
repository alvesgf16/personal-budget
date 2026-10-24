export const COLLECTIONS = {
  settings: 'settings',
  categories: 'categories',
  budgetCells: 'budgetCells',
  transactions: 'transactions',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export type StoreDocument<T extends object = Record<string, unknown>> = T & DocumentMeta;

interface DocumentMeta {
  id: string;
  updatedAt: string;
  /** ISO-8601 when soft-deleted; null while the document is active. */
  deletedAt: string | null;
}

/** Internal IndexedDB row; callers never see `collection`. */
export type StoredRow<T extends object = Record<string, unknown>> = StoreDocument<T> & {
  collection: CollectionName;
};
