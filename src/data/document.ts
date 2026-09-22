import type { CollectionName } from './collections';

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

/** A store document: caller payload T plus sync metadata. */
export type StoreDocument<T extends object = Record<string, unknown>> = T & DocumentMeta;

/**
 * Internal IndexedDB row: metadata + collection name + domain fields.
 * Callers never see `collection`; the API scopes by it.
 */
export type StoredRow<T extends object = Record<string, unknown>> = StoreDocument<T> & {
  collection: CollectionName;
};
