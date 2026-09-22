import Dexie, { type EntityTable } from 'dexie';
import type { StoredRow } from './document';

/**
 * Browser-local document database (IndexedDB via Dexie).
 * One object store holds every collection; rows are distinguished by `collection`.
 */
export class BudgetDatabase extends Dexie {
  documents!: EntityTable<StoredRow, 'id'>;

  constructor(name = 'personal-budget') {
    super(name);
    this.version(1).stores({
      // Primary key + indexes. deletedAt is not indexed: IndexedDB skips null keys.
      documents: 'id, collection, updatedAt',
    });
  }
}
