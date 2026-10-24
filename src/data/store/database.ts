import Dexie, { type EntityTable } from 'dexie';
import type { StoredRow } from './types';

/** One Dexie object store; rows are distinguished by `collection`. */
export class BudgetDatabase extends Dexie {
  documents!: EntityTable<StoredRow, 'id'>;

  constructor(name = 'personal-budget') {
    super(name);
    this.version(1).stores({
      // deletedAt is not indexed: IndexedDB skips null keys.
      documents: 'id, collection, updatedAt',
    });
  }
}
