import type { TestModuleMetadata } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { COLLECTIONS, type CollectionName } from '../types';
import { DOCUMENT_STORE } from './document-store.token';
import { createDocumentStore, type DocumentStore } from './document-store';
import type { DocumentStoreHarness } from './document-store.harness-types';

interface OpenedDocumentStoreHarness {
  store: DocumentStore;
  dispose: () => void;
}

interface DeferredRelease {
  untilReleased: Promise<void>;
  releaseStale: () => void;
}

interface CollectionListDeferral {
  deferredCollection: CollectionName;
  isActive: boolean;
  untilReleased: Promise<void>;
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

export function deferBudgetCellListInStore(storeHarness: DocumentStoreHarness) {
  return deferListInStore(COLLECTIONS.budgetCells, storeHarness);
}

export function deferCategoryListInStore(storeHarness: DocumentStoreHarness) {
  return deferListInStore(COLLECTIONS.categories, storeHarness);
}

export function deferSettingsListInStore(storeHarness: DocumentStoreHarness) {
  return deferListInStore(COLLECTIONS.settings, storeHarness);
}

/**
 * Defers only the first matching `list` until `releaseStale()` (later calls pass through).
 * Call before the stale load starts, trigger the load that should win, then releaseStale().
 * Budget cells: change the year input, or save so revision advances.
 * Categories: submit a mutation that refreshes the section.
 * Settings: save so loadGeneration advances.
 */
function deferListInStore(collection: CollectionName, storeHarness: DocumentStoreHarness) {
  const deferred = createDeferredRelease();
  const originalList = storeHarness.store.list.bind(storeHarness.store);
  const deferral: CollectionListDeferral = {
    deferredCollection: collection,
    isActive: true,
    untilReleased: deferred.untilReleased,
  };

  storeHarness.store.list = async <T extends object>(queriedCollection: CollectionName) => {
    const rows = await originalList<T>(queriedCollection);
    if (queriedCollection === deferral.deferredCollection) {
      await awaitDeferralIfActive(deferral);
    }
    return rows;
  };

  return { releaseStale: deferred.releaseStale };
}

function createDeferredRelease(): DeferredRelease {
  let releaseStale!: () => void;
  const untilReleased = new Promise<void>((resolve) => {
    releaseStale = resolve;
  });

  return { untilReleased, releaseStale };
}

async function awaitDeferralIfActive(deferral: CollectionListDeferral): Promise<void> {
  if (!deferral.isActive) {
    return;
  }

  deferral.isActive = false;
  await deferral.untilReleased;
}
