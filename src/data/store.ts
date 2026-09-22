import type { CollectionName } from './collections';
import { BudgetDatabase } from './database';
import type { StoreDocument, StoredRow } from './document';

const META_KEYS = new Set(['id', 'updatedAt', 'deletedAt', 'collection']);

function stripMeta<T extends object>(payload: T): Omit<T, keyof StoreDocument> {
  const clean = { ...payload } as Record<string, unknown>;
  for (const key of META_KEYS) {
    delete clean[key];
  }
  return clean as Omit<T, keyof StoreDocument>;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Generic collection API over IndexedDB.
 * Feature screens use DocumentStoreService; this class stays free of Angular DI.
 */
export class DocumentStore {
  constructor(private readonly db: BudgetDatabase) {}

  async insert<T extends object>(
    collection: CollectionName,
    payload: T,
  ): Promise<StoreDocument<T>> {
    const row: StoredRow<T> = {
      ...stripMeta(payload),
      collection,
      id: crypto.randomUUID(),
      updatedAt: nowIso(),
      deletedAt: null,
    } as StoredRow<T>;
    await this.db.documents.add(row as StoredRow);
    return toDocument(row);
  }

  async getById<T extends object>(
    collection: CollectionName,
    id: string,
  ): Promise<StoreDocument<T> | undefined> {
    const row = await this.db.documents.get(id);
    if (!row || row.collection !== collection) {
      return undefined;
    }
    return toDocument(row as StoredRow<T>);
  }

  async update<T extends object>(
    collection: CollectionName,
    id: string,
    patch: Partial<T>,
  ): Promise<StoreDocument<T> | undefined> {
    const existing = await this.db.documents.get(id);
    if (!existing || existing.collection !== collection) {
      return undefined;
    }
    const row: StoredRow<T> = {
      ...existing,
      ...stripMeta(patch),
      collection,
      id: existing.id,
      updatedAt: nowIso(),
      deletedAt: existing.deletedAt,
    } as StoredRow<T>;
    await this.db.documents.put(row as StoredRow);
    return toDocument(row);
  }

  async softDelete(collection: CollectionName, id: string): Promise<boolean> {
    const existing = await this.db.documents.get(id);
    if (!existing || existing.collection !== collection) {
      return false;
    }
    if (existing.deletedAt !== null) {
      return true;
    }
    await this.db.documents.put({
      ...existing,
      deletedAt: nowIso(),
      updatedAt: nowIso(),
    });
    return true;
  }

  async list<T extends object>(collection: CollectionName): Promise<StoreDocument<T>[]> {
    // Query by collection, then drop soft-deleted rows in memory (null is not indexed).
    const rows = await this.db.documents.where('collection').equals(collection).toArray();
    return rows
      .filter((row) => row.deletedAt === null)
      .map((row) => toDocument(row as StoredRow<T>));
  }

  close(): void {
    this.db.close();
  }
}

function toDocument<T extends object>(row: StoredRow<T>): StoreDocument<T> {
  const doc = { ...row } as StoreDocument<T> & { collection?: CollectionName };
  delete doc.collection;
  return doc;
}

/** Factory for tests (unique DB name) and the DOCUMENT_STORE token. */
export function createDocumentStore(dbName?: string): DocumentStore {
  return new DocumentStore(new BudgetDatabase(dbName));
}
