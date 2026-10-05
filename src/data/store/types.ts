/**
 * Named piles (“collections”) in the document store.
 * Prefer these constants; store and service APIs only accept CollectionName.
 */
export const COLLECTIONS = {
  settings: 'settings',
  categories: 'categories',
  budgetCells: 'budgetCells',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Shared metadata on every persisted document.
 * Domain payloads (settings, categories, …) extend this via StoreDocument<T>.
 */
export interface DocumentMeta {
  id: string;
  updatedAt: string;
  /** ISO-8601 when soft-deleted; null while the document is active. */
  deletedAt: string | null;
}

export type StoreDocument<T extends object = Record<string, unknown>> = T & DocumentMeta;

/**
 * Internal IndexedDB row: metadata + collection name + domain fields.
 * Callers never see `collection`; the API scopes by it.
 */
export type StoredRow<T extends object = Record<string, unknown>> = StoreDocument<T> & {
  collection: CollectionName;
};
