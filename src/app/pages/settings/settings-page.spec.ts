import { COLLECTIONS } from '../../../data/store/types';
import {
  deferFirstStoreSettingsList,
  provideDocumentStoreHarness,
  rejectFirstStoreInsert,
} from '../../../data/store/document-store/document-store.harness';
import type { Settings } from '../../../data/domains/settings/settings';
import { PlanPage } from '../plan/plan-page';
import { planHarness } from '../plan/plan-page.harness';
import { SettingsPage } from './settings-page';
import { settingsHarness } from './settings-page.harness';

describe('Settings starting year', () => {
  const storeHarness = provideDocumentStoreHarness('pb-19-settings', {
    imports: [SettingsPage, PlanPage],
  });
  const {
    renderSettings,
    startSettingsLoadWithoutWaiting,
    submitStartingYear,
    typeStartingYearWithoutWaiting,
    submitStartingYearWithoutWaiting,
    startingYearInputValue,
    alertText,
  } = settingsHarness();
  const { renderPlan, headerText } = planHarness(storeHarness);

  it('rejects an empty year with an alert and does not persist', async () => {
    const fixture = await renderSettings();

    await submitStartingYear(fixture, '');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1900');
    expect(saved).toEqual([]);
  });

  it('rejects a year below the minimum and does not persist', async () => {
    const fixture = await renderSettings();

    await submitStartingYear(fixture, '1899');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1900');
    expect(saved).toEqual([]);
  });

  it('rejects a non-integer year and does not persist', async () => {
    const fixture = await renderSettings();

    await submitStartingYear(fixture, '2026.5');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1900');
    expect(saved).toEqual([]);
  });

  it('saves a starting year as a single settings row', async () => {
    const fixture = await renderSettings();

    await submitStartingYear(fixture, '2026');
    const saved = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(alertText(fixture)).toBeNull();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2026);
  });

  it('updates the same settings row on a second save', async () => {
    const fixture = await renderSettings();
    await submitStartingYear(fixture, '2026');

    await submitStartingYear(fixture, '2027');
    const updated = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(updated).toHaveLength(1);
    expect(updated[0]?.startingYear).toBe(2027);
  });

  it('shows the stored starting year in the input on load', async () => {
    const primed = await renderSettings();
    await submitStartingYear(primed, '2026');
    primed.destroy();

    const fixture = await renderSettings();

    expect(startingYearInputValue(fixture)).toBe('2026');
  });

  it('shows the stored starting year on Plan after settings destroy', async () => {
    const settingsFixture = await renderSettings();
    await submitStartingYear(settingsFixture, '2027');
    settingsFixture.destroy();

    const planFixture = await renderPlan();

    expect(headerText(planFixture)).toBe('2027');
  });

  it('shows an error when save persistence fails', async () => {
    storeHarness.store.insert = () => Promise.reject(new Error('unavailable'));
    const fixture = await renderSettings();

    await submitStartingYear(fixture, '2026');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('Could not save');
    expect(saved).toEqual([]);
  });

  it('ignores a stale save error after a later save succeeds', async () => {
    const { whenFirstInsertArrives, releaseFirstInsert } = rejectFirstStoreInsert(storeHarness);
    const fixture = await renderSettings();

    submitStartingYearWithoutWaiting(fixture, '2026');
    await whenFirstInsertArrives;
    submitStartingYearWithoutWaiting(fixture, '2027');
    releaseFirstInsert();
    await fixture.whenStable();
    fixture.detectChanges();
    const saved = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(alertText(fixture)).toBeNull();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2027);
  });

  it('shows an error when settings cannot be loaded', async () => {
    storeHarness.store.list = () => Promise.reject(new Error('unavailable'));

    const fixture = await renderSettings();

    expect(alertText(fixture)).toContain('Could not load');
  });

  it('ignores a stale load when a save is queued behind it', async () => {
    const primed = await renderSettings();
    await submitStartingYear(primed, '2026');
    primed.destroy();

    const { whenFirstListArrives, releaseFirstList } = deferFirstStoreSettingsList(storeHarness);
    const fixture = await startSettingsLoadWithoutWaiting();

    await whenFirstListArrives;
    submitStartingYearWithoutWaiting(fixture, '2027');
    releaseFirstList();
    await fixture.whenStable();
    fixture.detectChanges();
    const saved = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(startingYearInputValue(fixture)).toBe('2027');
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2027);
  });

  it('keeps a typed year when load finishes after the edit', async () => {
    const primed = await renderSettings();
    await submitStartingYear(primed, '2026');
    primed.destroy();

    const { whenFirstListArrives, releaseFirstList } = deferFirstStoreSettingsList(storeHarness);
    const fixture = await startSettingsLoadWithoutWaiting();

    await whenFirstListArrives;
    typeStartingYearWithoutWaiting(fixture, '2028');
    releaseFirstList();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(startingYearInputValue(fixture)).toBe('2028');
    expect(alertText(fixture)).toBeNull();
  });
});

describe('Settings late monthly income', () => {
  const storeHarness = provideDocumentStoreHarness('pb-24-settings', {
    imports: [SettingsPage],
  });
  const {
    renderSettings,
    submitSettings,
    lateIncomeShiftValue,
    lateIncomeShiftStartingDayValue,
    lateIncomeShiftStartingDayDisabled,
    setLateIncomeShift,
    alertText,
  } = settingsHarness();

  it('disables the starting day control only while late income is inactive', async () => {
    const fixture = await renderSettings();

    expect(lateIncomeShiftStartingDayDisabled(fixture)).toBe(true);

    setLateIncomeShift(fixture, 'active');
    expect(lateIncomeShiftStartingDayDisabled(fixture)).toBe(false);

    setLateIncomeShift(fixture, 'inactive');
    expect(lateIncomeShiftStartingDayDisabled(fixture)).toBe(true);
  });

  it('saves active late income and reloads it on the Settings tab', async () => {
    const primed = await renderSettings();
    await submitSettings(primed, {
      startingYear: '2026',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '20',
    });
    primed.destroy();

    const fixture = await renderSettings();
    const saved = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(lateIncomeShiftValue(fixture)).toBe('active');
    expect(lateIncomeShiftStartingDayValue(fixture)).toBe('20');
    expect(saved[0]?.lateIncomeShift).toBe('active');
    expect(saved[0]?.lateIncomeShiftStartingDay).toBe(20);
  });

  it('rejects a starting day outside 1–31 and does not persist', async () => {
    const fixture = await renderSettings();

    await submitSettings(fixture, {
      startingYear: '2026',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '32',
    });
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1 and 31');
    expect(saved).toEqual([]);
  });
});
