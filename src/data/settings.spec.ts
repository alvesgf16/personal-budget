import { COLLECTIONS } from './collections';
import { useTestStore } from './document-store.testing';
import { parseStartingYear, settingsSchema, type Settings } from './settings';

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

describe('parseStartingYear', () => {
  it('parses a whole year in range', () => {
    expect(parseStartingYear(' 2026 ')).toEqual({ startingYear: 2026 });
  });

  it('returns null for empty or invalid input', () => {
    expect(parseStartingYear('')).toBeNull();
    expect(parseStartingYear('1899')).toBeNull();
    expect(parseStartingYear('2026.5')).toBeNull();
  });
});

describe('settings store round-trip', () => {
  const testDb = useTestStore('pb-settings-test');

  it('inserts and reads a parsed settings payload', async () => {
    const payload = settingsSchema.parse({ startingYear: 2026 });
    const created = await testDb.store.insert(COLLECTIONS.settings, payload);
    const found = await testDb.store.getById<Settings>(COLLECTIONS.settings, created.id);

    expect(found).toEqual(created);
    expect(found?.startingYear).toBe(2026);
  });
});
