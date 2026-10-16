import { COLLECTIONS } from '../../data/store/types';
import { provideDocumentStoreHarness } from '../../data/store/document-store/document-store.harness';
import type { Settings as DomainSettings } from '../../data/domains/settings/settings';
import { Plan } from '../plan/plan';
import { planHarness } from '../plan/plan.harness';
import { Settings } from './settings';
import { settingsHarness } from './settings.harness';

describe('Settings starting year', () => {
  const storeHarness = provideDocumentStoreHarness('pb-19-settings', {
    imports: [Settings, Plan],
  });
  const { renderSettings, submitYear, alertText } = settingsHarness();
  const { renderPlan, headerText } = planHarness(storeHarness);

  it('rejects an empty year with an alert and does not persist', async () => {
    const fixture = await renderSettings();

    await submitYear(fixture, '');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1900');
    expect(saved).toEqual([]);
  });

  it('rejects a year below the minimum and does not persist', async () => {
    const fixture = await renderSettings();

    await submitYear(fixture, '1899');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1900');
    expect(saved).toEqual([]);
  });

  it('rejects a non-integer year and does not persist', async () => {
    const fixture = await renderSettings();

    await submitYear(fixture, '2026.5');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('1900');
    expect(saved).toEqual([]);
  });

  it('saves a starting year as a single settings row', async () => {
    const fixture = await renderSettings();

    await submitYear(fixture, '2026');
    const saved = await storeHarness.store.list<DomainSettings>(COLLECTIONS.settings);

    expect(alertText(fixture)).toBeNull();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2026);
  });

  it('updates the same settings row on a second save', async () => {
    const fixture = await renderSettings();
    await submitYear(fixture, '2026');

    await submitYear(fixture, '2027');
    const updated = await storeHarness.store.list<DomainSettings>(COLLECTIONS.settings);

    expect(updated).toHaveLength(1);
    expect(updated[0]?.startingYear).toBe(2027);
  });

  it('shows the stored starting year on Plan after settings destroy', async () => {
    const settingsFixture = await renderSettings();
    await submitYear(settingsFixture, '2027');
    settingsFixture.destroy();

    const planFixture = await renderPlan();

    expect(headerText(planFixture)).toBe('2027');
  });

  it('shows an error when save persistence fails', async () => {
    storeHarness.store.insert = () => Promise.reject(new Error('unavailable'));
    const fixture = await renderSettings();

    await submitYear(fixture, '2026');
    const saved = await storeHarness.store.list(COLLECTIONS.settings);

    expect(alertText(fixture)).toContain('Could not save');
    expect(saved).toEqual([]);
  });

  it('shows an error when settings cannot be loaded', async () => {
    storeHarness.store.list = () => Promise.reject(new Error('unavailable'));

    const fixture = await renderSettings();

    expect(alertText(fixture)).toContain('Could not load');
  });
});
