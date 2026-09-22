import { COLLECTIONS } from './collections';
import { settingsSchema, type Settings } from './settings';
import { createDocumentStore, type DocumentStore } from './store';

describe('settingsSchema', () => {
  it('accepts a valid starting year', () => {
    expect(settingsSchema.parse({ startingYear: 2026 })).toEqual({ startingYear: 2026 });
  });

  it('rejects a missing startingYear', () => {
    expect(() => settingsSchema.parse({})).toThrow();
  });

  it('rejects a string year', () => {
    expect(() => settingsSchema.parse({ startingYear: '2026' })).toThrow();
  });

  it('rejects a fractional year', () => {
    expect(() => settingsSchema.parse({ startingYear: 2026.5 })).toThrow();
  });

  it('rejects a year outside the allowed range', () => {
    expect(() => settingsSchema.parse({ startingYear: 1899 })).toThrow();
    expect(() => settingsSchema.parse({ startingYear: 2101 })).toThrow();
  });
});

describe('settings store round-trip', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(() => {
    dbName = `pb-settings-test-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('inserts and reads a settings document with store metadata', async () => {
    const payload = settingsSchema.parse({ startingYear: 2026 });
    const created = await store.insert(COLLECTIONS.settings, payload);
    const found = await store.getById<Settings>(COLLECTIONS.settings, created.id);

    expect(found).toEqual(created);
    expect(found?.startingYear).toBe(2026);
    expect(found?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(found?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(found?.deletedAt).toBeNull();
  });
});
