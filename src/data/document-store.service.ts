import { inject, Injectable, InjectionToken } from '@angular/core';
import type { CollectionName } from './collections';
import type { StoreDocument } from './document';
import { createDocumentStore, type DocumentStore } from './store';

/**
 * Root token for the plain DocumentStore. Tests override this with a unique DB name.
 */
export const DOCUMENT_STORE = new InjectionToken<DocumentStore>('DOCUMENT_STORE', {
  providedIn: 'root',
  factory: () => createDocumentStore(),
});

/**
 * Injectable facade over the Dexie collection API.
 * Feature screens inject this — they never open IndexedDB or touch Dexie directly.
 */
@Injectable({ providedIn: 'root' })
export class DocumentStoreService {
  private readonly store = inject(DOCUMENT_STORE);

  insert<T extends object>(collection: CollectionName, payload: T): Promise<StoreDocument<T>> {
    return this.store.insert(collection, payload);
  }

  getById<T extends object>(
    collection: CollectionName,
    id: string,
  ): Promise<StoreDocument<T> | undefined> {
    return this.store.getById(collection, id);
  }

  update<T extends object>(
    collection: CollectionName,
    id: string,
    patch: Partial<T>,
  ): Promise<StoreDocument<T> | undefined> {
    return this.store.update(collection, id, patch);
  }

  softDelete(collection: CollectionName, id: string): Promise<boolean> {
    return this.store.softDelete(collection, id);
  }

  list<T extends object>(collection: CollectionName): Promise<StoreDocument<T>[]> {
    return this.store.list(collection);
  }
}
