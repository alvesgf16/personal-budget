import type { TestModuleMetadata } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT_STORE } from './document-store.token';
import { createDocumentStore, type DocumentStore } from './document-store';

export interface TestDocumentStore {
  store: DocumentStore;
}

export function openTestStore(prefix: string): { store: DocumentStore; dispose: () => void } {
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

/** Unique IndexedDB for schema/store specs (no TestBed). */
export function useTestStore(prefix: string): TestDocumentStore {
  const testStore = {} as TestDocumentStore;
  let dispose!: () => void;

  beforeEach(() => {
    const opened = openTestStore(prefix);
    testStore.store = opened.store;
    dispose = opened.dispose;
  });

  afterEach(() => {
    dispose();
  });

  return testStore;
}

/** Unique IndexedDB plus DOCUMENT_STORE override for TestBed specs. */
export function provideTestDocumentStore(
  prefix: string,
  options: Pick<TestModuleMetadata, 'imports'> = {},
): TestDocumentStore {
  const testStore = {} as TestDocumentStore;
  let dispose!: () => void;

  beforeEach(async () => {
    const opened = openTestStore(prefix);
    testStore.store = opened.store;
    dispose = opened.dispose;
    await TestBed.configureTestingModule({
      imports: options.imports ?? [],
      providers: [{ provide: DOCUMENT_STORE, useValue: testStore.store }],
    }).compileComponents();
  });

  afterEach(() => {
    dispose();
  });

  return testStore;
}
