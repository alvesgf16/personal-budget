import { COLLECTIONS } from '../../store/types';
import { useDocumentStoreHarness } from '../../store/document-store/document-store.harness';
import { parseSettings, settingsSchema, type Settings } from './settings';

const defaultLateIncome = {
  shiftLateIncome: 'inactive',
  shiftLateIncomeStartingDay: 1,
} as const;

describe('settingsSchema', () => {
  it('accepts a valid starting year and fills late-income defaults', () => {
    expect(settingsSchema.parse({ startingYear: 2026 })).toEqual({
      startingYear: 2026,
      ...defaultLateIncome,
    });
  });

  it('accepts an explicit late-income configuration', () => {
    expect(
      settingsSchema.parse({
        startingYear: 2026,
        shiftLateIncome: 'active',
        shiftLateIncomeStartingDay: 20,
      }),
    ).toEqual({
      startingYear: 2026,
      shiftLateIncome: 'active',
      shiftLateIncomeStartingDay: 20,
    });
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

  it('rejects an invalid shiftLateIncome value', () => {
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        shiftLateIncome: 'maybe',
      }),
    ).toThrow();
  });

  it('rejects a starting day outside 1–31', () => {
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        shiftLateIncomeStartingDay: 0,
      }),
    ).toThrow();
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        shiftLateIncomeStartingDay: 32,
      }),
    ).toThrow();
  });

  it('rejects a fractional starting day', () => {
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        shiftLateIncomeStartingDay: 15.5,
      }),
    ).toThrow();
  });
});

describe('parseSettings', () => {
  it('parses a whole year in range with late-income defaults', () => {
    expect(parseSettings(' 2026 ')).toEqual({
      startingYear: 2026,
      ...defaultLateIncome,
    });
  });

  it('returns null for empty or invalid input', () => {
    expect(parseSettings('')).toBeNull();
    expect(parseSettings('1899')).toBeNull();
    expect(parseSettings('2026.5')).toBeNull();
  });
});

describe('settings store round-trip', () => {
  const storeHarness = useDocumentStoreHarness('pb-settings-test');

  it('inserts and reads a parsed settings payload', async () => {
    const payload = settingsSchema.parse({
      startingYear: 2026,
      shiftLateIncome: 'active',
      shiftLateIncomeStartingDay: 20,
    });
    const created = await storeHarness.store.insert(COLLECTIONS.settings, payload);
    const found = await storeHarness.store.getById<Settings>(COLLECTIONS.settings, created.id);

    expect(found).toEqual(created);
    expect(found?.startingYear).toBe(2026);
    expect(found?.shiftLateIncome).toBe('active');
    expect(found?.shiftLateIncomeStartingDay).toBe(20);
  });
});
