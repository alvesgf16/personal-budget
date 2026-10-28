import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../store/types';
import {
  deferFirstStoreInsert,
  deferFirstStoreSettingsList,
  provideDocumentStoreHarness,
} from '../../store/document-store/document-store.harness';
import type { Settings } from './settings';
import { SettingsService } from './settings.service';

const defaults2026: Settings = {
  startingYear: 2026,
  lateIncomeShift: 'inactive',
  lateIncomeShiftStartingDay: 1,
};
const active2026: Settings = {
  startingYear: 2026,
  lateIncomeShift: 'active',
  lateIncomeShiftStartingDay: 20,
};

describe('SettingsService', () => {
  const storeHarness = provideDocumentStoreHarness('pb-settings-service');
  let service: SettingsService;

  beforeEach(() => {
    service = TestBed.inject(SettingsService);
  });

  it('returns null when no settings document exists', async () => {
    expect(await service.get()).toBeNull();
  });

  it('gets settings from the store and fills late-income defaults', async () => {
    await storeHarness.store.insert(COLLECTIONS.settings, { startingYear: 2026 });

    expect(await service.get()).toEqual(defaults2026);
  });

  it('inserts a settings document on first save', async () => {
    await service.save(active2026);
    const created = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(created).toHaveLength(1);
    expect(created[0]?.startingYear).toBe(2026);
    expect(created[0]?.lateIncomeShift).toBe('active');
    expect(created[0]?.lateIncomeShiftStartingDay).toBe(20);
  });

  it('updates the same settings document on a later save', async () => {
    await service.save(defaults2026);
    const created = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    await service.save({ ...defaults2026, startingYear: 2027 });
    const updated = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(updated).toHaveLength(1);
    expect(updated[0]?.id).toBe(created[0]?.id);
    expect(updated[0]?.startingYear).toBe(2027);
  });

  it('round-trips late-income fields through get after save', async () => {
    await service.save(active2026);

    expect(await service.get()).toEqual(active2026);
  });

  it('serializes save behind an in-flight get so documentId stays consistent', async () => {
    const { whenFirstListArrives, releaseFirstList } = deferFirstStoreSettingsList(storeHarness);
    const pendingGet = service.get();

    await whenFirstListArrives;
    const pendingSave = service.save({ ...defaults2026, startingYear: 2027 });
    releaseFirstList();
    await Promise.all([pendingGet, pendingSave]);
    const afterOverlap = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    await service.save({ ...defaults2026, startingYear: 2028 });
    const saved = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(saved).toHaveLength(1);
    expect(saved[0]?.id).toBe(afterOverlap[0]?.id);
    expect(saved[0]?.startingYear).toBe(2028);
  });

  it('keeps overlapping saves on a single settings document', async () => {
    const { whenFirstInsertArrives, releaseFirstInsert } = deferFirstStoreInsert(storeHarness);

    const first = service.save(defaults2026);
    await whenFirstInsertArrives;
    const second = service.save({ ...defaults2026, startingYear: 2027 });
    releaseFirstInsert();
    await Promise.all([first, second]);
    const saved = await storeHarness.store.list<Settings>(COLLECTIONS.settings);

    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2027);
  });
});
