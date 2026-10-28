import { COLLECTIONS } from '../../store/types';
import { useDocumentStoreHarness } from '../../store/document-store/document-store.harness';
import { parseSettings, settingsSchema, type Settings } from './settings';

const defaultLateIncome = {
  lateIncomeShift: 'inactive',
  lateIncomeShiftStartingDay: 1,
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
        lateIncomeShift: 'active',
        lateIncomeShiftStartingDay: 20,
      }),
    ).toEqual({
      startingYear: 2026,
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: 20,
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

  it('rejects an invalid lateIncomeShift value', () => {
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        lateIncomeShift: 'maybe',
      }),
    ).toThrow();
  });

  it('rejects a starting day outside 1–31', () => {
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        lateIncomeShiftStartingDay: 0,
      }),
    ).toThrow();
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        lateIncomeShiftStartingDay: 32,
      }),
    ).toThrow();
  });

  it('rejects a fractional starting day', () => {
    expect(() =>
      settingsSchema.parse({
        startingYear: 2026,
        lateIncomeShiftStartingDay: 15.5,
      }),
    ).toThrow();
  });
});

const defaultLateIncomeInput = {
  lateIncomeShift: 'inactive',
  lateIncomeShiftStartingDay: '1',
} as const;

describe('parseSettings', () => {
  it('parses a whole year in range with late-income fields', () => {
    expect(
      parseSettings({
        startingYear: ' 2026 ',
        ...defaultLateIncomeInput,
      }),
    ).toEqual({
      startingYear: 2026,
      ...defaultLateIncome,
    });
  });

  it('parses an active late-income configuration', () => {
    expect(
      parseSettings({
        startingYear: '2026',
        lateIncomeShift: 'active',
        lateIncomeShiftStartingDay: '20',
      }),
    ).toEqual({
      startingYear: 2026,
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: 20,
    });
  });

  it('returns null for empty or invalid year', () => {
    expect(parseSettings({ startingYear: '', ...defaultLateIncomeInput })).toBeNull();
    expect(parseSettings({ startingYear: '1899', ...defaultLateIncomeInput })).toBeNull();
    expect(parseSettings({ startingYear: '2026.5', ...defaultLateIncomeInput })).toBeNull();
  });

  it('returns null for a day outside 1–31', () => {
    expect(
      parseSettings({
        startingYear: '2026',
        lateIncomeShift: 'active',
        lateIncomeShiftStartingDay: '0',
      }),
    ).toBeNull();
    expect(
      parseSettings({
        startingYear: '2026',
        lateIncomeShift: 'active',
        lateIncomeShiftStartingDay: '32',
      }),
    ).toBeNull();
  });
});

describe('settings store round-trip', () => {
  const storeHarness = useDocumentStoreHarness('pb-settings-test');

  it('inserts and reads a parsed settings payload', async () => {
    const payload = settingsSchema.parse({
      startingYear: 2026,
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: 20,
    });
    const created = await storeHarness.store.insert(COLLECTIONS.settings, payload);
    const found = await storeHarness.store.getById<Settings>(COLLECTIONS.settings, created.id);

    expect(found).toEqual(created);
    expect(found?.startingYear).toBe(2026);
    expect(found?.lateIncomeShift).toBe('active');
    expect(found?.lateIncomeShiftStartingDay).toBe(20);
  });
});
