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

interface Deferred {
  whenNotified: Promise<void>;
  notify: () => void;
}

interface ListGate {
  collection: CollectionName;
  firstListRelease: Deferred;
  firstListArrival: Deferred;
  nextListCompletion: Deferred;
  isFirstListBeingHeld: boolean;
  isNextListWatchArmed: boolean;
  isNextListCompletionNotified: boolean;
}

interface ListDeferralControls {
  whenFirstListArrives: Promise<void>;
  /**
   * After the competing load has been triggered, call this then await `whenNextListCompletes`
   * so a parallel sibling `list` from the deferred load is not mistaken for the winner.
   */
  armNextListWatch: () => void;
  whenNextListCompletes: Promise<void>;
  releaseFirstList: () => void;
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

export function deferFirstStoreBudgetCellList(storeHarness: DocumentStoreHarness) {
  return deferFirstStoreList(COLLECTIONS.budgetCells, storeHarness);
}

export function deferFirstStoreCategoryList(storeHarness: DocumentStoreHarness) {
  return deferFirstStoreList(COLLECTIONS.categories, storeHarness);
}

export function deferFirstStoreSettingsList(storeHarness: DocumentStoreHarness) {
  return deferFirstStoreList(COLLECTIONS.settings, storeHarness);
}

/**
 * Defers only the first matching `list` until `releaseFirstList()` (later calls pass through).
 * Settings get and save share PersistQueue, so a deferred settings list can safely overlap a save.
 */
function deferFirstStoreList(
  collection: CollectionName,
  storeHarness: DocumentStoreHarness,
): ListDeferralControls {
  const gate = createListGate(collection);
  const originalList = storeHarness.store.list.bind(storeHarness.store);

  storeHarness.store.list = async <T extends object>(queriedCollection: CollectionName) => {
    const rows = await originalList<T>(queriedCollection);
    await applyListGate(gate, queriedCollection);
    return rows;
  };

  return {
    whenFirstListArrives: gate.firstListArrival.whenNotified,
    armNextListWatch: () => {
      gate.isNextListWatchArmed = true;
    },
    whenNextListCompletes: gate.nextListCompletion.whenNotified,
    releaseFirstList: () => {
      gate.firstListRelease.notify();
      gate.isFirstListBeingHeld = false;
    },
  };
}

function createListGate(collection: CollectionName): ListGate {
  return {
    collection,
    firstListArrival: createDeferred(),
    firstListRelease: createDeferred(),
    nextListCompletion: createDeferred(),
    isFirstListBeingHeld: false,
    isNextListWatchArmed: false,
    isNextListCompletionNotified: false,
  };
}

function createDeferred(): Deferred {
  let notify!: () => void;

  const whenNotified = new Promise<void>((resolve) => {
    notify = resolve;
  });

  return { whenNotified, notify };
}

async function applyListGate(gate: ListGate, queriedCollection: CollectionName): Promise<void> {
  if (queriedCollection !== gate.collection) {
    return;
  }

  if (!gate.isFirstListBeingHeld) {
    await holdFirstList(gate);
    return;
  }

  notifyNextListIfArmed(gate);
}

async function holdFirstList(gate: ListGate): Promise<void> {
  gate.isFirstListBeingHeld = true;
  gate.firstListArrival.notify();
  await gate.firstListRelease.whenNotified;
}

function notifyNextListIfArmed(gate: ListGate): void {
  if (!gate.isNextListWatchArmed || gate.isNextListCompletionNotified) {
    return;
  }

  gate.nextListCompletion.notify();
  gate.isNextListCompletionNotified = true;
}
