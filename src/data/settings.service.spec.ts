import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from './collections';
import { DOCUMENT_STORE } from './document-store.token';
import type { Settings } from './settings';
import { SettingsService } from './settings.service';
import { createDocumentStore, type DocumentStore } from './store';

describe('SettingsService', () => {
  let store: DocumentStore;
  let dbName: string;
  let service: SettingsService;

  beforeEach(() => {
    dbName = `pb-settings-service-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('returns null when no settings document exists', async () => {
    expect(await service.load()).toBeNull();
  });

  it('loads the starting year from the store', async () => {
    await store.insert(COLLECTIONS.settings, { startingYear: 2026 });

    expect(await service.load()).toEqual({ startingYear: 2026 });
  });

  it('inserts then updates a single settings document', async () => {
    await service.save({ startingYear: 2026 });
    const created = await store.list<Settings>(COLLECTIONS.settings);
    expect(created).toHaveLength(1);
    expect(created[0]?.startingYear).toBe(2026);

    await service.save({ startingYear: 2027 });
    const updated = await store.list<Settings>(COLLECTIONS.settings);
    expect(updated).toHaveLength(1);
    expect(updated[0]?.id).toBe(created[0]?.id);
    expect(updated[0]?.startingYear).toBe(2027);
  });

  it('keeps overlapping saves on a single settings document', async () => {
    const originalInsert = store.insert.bind(store);
    let releaseInsert: () => void = () => undefined;
    const insertHold = new Promise<void>((resolve) => {
      releaseInsert = resolve;
    });
    let enteredInsert: () => void = () => undefined;
    const insertStarted = new Promise<void>((resolve) => {
      enteredInsert = resolve;
    });
    store.insert = async (collection, payload) => {
      enteredInsert();
      await insertHold;
      return originalInsert(collection, payload);
    };

    const first = service.save({ startingYear: 2026 });
    await insertStarted;
    const second = service.save({ startingYear: 2027 });
    releaseInsert();
    await Promise.all([first, second]);

    const saved = await store.list<Settings>(COLLECTIONS.settings);
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2027);
  });
});
