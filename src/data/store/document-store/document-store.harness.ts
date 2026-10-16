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
  releaseDeferred: () => void;
}

interface CollectionListDeferral {
  deferredCollection: CollectionName;
  isActive: boolean;
  untilReleased: Promise<void>;
  notifyDeferred: () => void;
}

interface ListDeferralControls {
  releaseDeferred: () => void;
  /** Resolves when the first matching `list` reaches the deferral gate. */
  whenDeferred: Promise<void>;
  /**
   * After the competing load has been triggered, call this then await `whenNextList`
   * so a parallel sibling `list` from the deferred load is not mistaken for the winner.
   */
  armNextList: () => void;
  /** Resolves when the next armed matching pass-through `list` completes. */
  whenNextList: Promise<void>;
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
 * Defers only the first matching `list` until `releaseDeferred()` (later calls pass through).
 * Await `whenDeferred`, trigger the winning load, `armNextList()`, await `whenNextList`,
 * then releaseDeferred(). Settings: save is queued behind get — release after arming is N/A.
 */
function deferListInStore(
  collection: CollectionName,
  storeHarness: DocumentStoreHarness,
): ListDeferralControls {
  const deferred = createDeferredRelease();
  let notifyDeferred!: () => void;
  const whenDeferred = new Promise<void>((resolve) => {
    notifyDeferred = resolve;
  });
  let notifyNextList!: () => void;
  const whenNextList = new Promise<void>((resolve) => {
    notifyNextList = resolve;
  });
  let nextListArmed = false;
  let nextListNotified = false;
  const originalList = storeHarness.store.list.bind(storeHarness.store);
  const deferral: CollectionListDeferral = {
    deferredCollection: collection,
    isActive: true,
    untilReleased: deferred.untilReleased,
    notifyDeferred,
  };

  storeHarness.store.list = async <T extends object>(queriedCollection: CollectionName) => {
    const rows = await originalList<T>(queriedCollection);
    if (queriedCollection !== deferral.deferredCollection) {
      return rows;
    }

    if (deferral.isActive) {
      await awaitDeferralIfActive(deferral);
      return rows;
    }

    if (nextListArmed && !nextListNotified) {
      nextListNotified = true;
      notifyNextList();
    }

    return rows;
  };

  return {
    releaseDeferred: deferred.releaseDeferred,
    whenDeferred,
    armNextList: () => {
      nextListArmed = true;
    },
    whenNextList,
  };
}

function createDeferredRelease(): DeferredRelease {
  let releaseDeferred!: () => void;
  const untilReleased = new Promise<void>((resolve) => {
    releaseDeferred = resolve;
  });

  return { untilReleased, releaseDeferred };
}

async function awaitDeferralIfActive(deferral: CollectionListDeferral): Promise<void> {
  if (!deferral.isActive) {
    return;
  }

  deferral.isActive = false;
  deferral.notifyDeferred();
  await deferral.untilReleased;
}
