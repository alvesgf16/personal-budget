import type { TestModuleMetadata } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { COLLECTIONS, type CollectionName } from '../types';
import { DOCUMENT_STORE } from './document-store.token';
import { createDocumentStore, type DocumentStore } from './document-store';

export interface DocumentStoreHarness {
  store: DocumentStore;
}

interface OpenedDocumentStoreHarness {
  store: DocumentStore;
  dispose: () => void;
}

/** Unique IndexedDB for schema/store specs (no TestBed). */
export function useDocumentStoreHarness(prefix: string): DocumentStoreHarness {
  const harness = {} as DocumentStoreHarness;
  let dispose!: () => void;

  beforeEach(() => {
    const opened = openDocumentStoreHarness(prefix);

    harness.store = opened.store;
    dispose = opened.dispose;
  });

  afterEach(() => {
    dispose();
  });

  return harness;
}

/** Unique IndexedDB plus DOCUMENT_STORE override for TestBed specs. */
export function provideDocumentStoreHarness(
  prefix: string,
  options: Pick<TestModuleMetadata, 'imports'> = {},
): DocumentStoreHarness {
  const harness = {} as DocumentStoreHarness;
  let dispose!: () => void;

  beforeEach(async () => {
    const opened = openDocumentStoreHarness(prefix);

    harness.store = opened.store;
    dispose = opened.dispose;

    await TestBed.configureTestingModule({
      imports: options.imports ?? [],
      providers: [{ provide: DOCUMENT_STORE, useValue: harness.store }],
    }).compileComponents();
  });

  afterEach(() => {
    dispose();
  });

  return harness;
}

/** Stall the first budgetCells list until releaseFirst(); for stale-load races. */
export function holdFirstBudgetCellList(storeHarness: DocumentStoreHarness) {
  let releaseFirst!: () => void;

  const firstListGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const originalList = storeHarness.store.list.bind(storeHarness.store);
  let budgetListCalls = 0;

  storeHarness.store.list = async <T extends object>(collection: CollectionName) => {
    const rows = await originalList<T>(collection);

    if (collection === COLLECTIONS.budgetCells) {
      budgetListCalls += 1;

      if (budgetListCalls === 1) {
        await firstListGate;
      }
    }

    return rows;
  };

  return { releaseFirst };
}

function openDocumentStoreHarness(prefix: string): OpenedDocumentStoreHarness {
  const dbName = `${prefix}-${crypto.randomUUID()}`;
  const store = createDocumentStore(dbName);

  return {
    store,
    dispose: () => {
      store.close();
      indexedDB.deleteDatabase(dbName);
    },
  };
}
