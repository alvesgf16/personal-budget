import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../store/types';
import { provideTestDocumentStore } from '../../store/document-store/document-store.testing';
import type { Settings } from './settings';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const testStore = provideTestDocumentStore('pb-settings-service');
  let service: SettingsService;

  beforeEach(() => {
    service = TestBed.inject(SettingsService);
  });

  it('returns null when no settings document exists', async () => {
    expect(await service.get()).toBeNull();
  });

  it('gets the starting year from the store', async () => {
    await testStore.store.insert(COLLECTIONS.settings, { startingYear: 2026 });

    expect(await service.get()).toEqual({ startingYear: 2026 });
  });

  it('inserts then updates a single settings document', async () => {
    await service.save({ startingYear: 2026 });
    const created = await testStore.store.list<Settings>(COLLECTIONS.settings);
    expect(created).toHaveLength(1);
    expect(created[0]?.startingYear).toBe(2026);

    await service.save({ startingYear: 2027 });
    const updated = await testStore.store.list<Settings>(COLLECTIONS.settings);
    expect(updated).toHaveLength(1);
    expect(updated[0]?.id).toBe(created[0]?.id);
    expect(updated[0]?.startingYear).toBe(2027);
  });

  it('keeps overlapping saves on a single settings document', async () => {
    const originalInsert = testStore.store.insert.bind(testStore.store);
    let releaseInsert: () => void = () => undefined;
    const insertHold = new Promise<void>((resolve) => {
      releaseInsert = resolve;
    });
    let enteredInsert: () => void = () => undefined;
    const insertStarted = new Promise<void>((resolve) => {
      enteredInsert = resolve;
    });
    testStore.store.insert = async (collection, payload) => {
      enteredInsert();
      await insertHold;
      return originalInsert(collection, payload);
    };

    const first = service.save({ startingYear: 2026 });
    await insertStarted;
    const second = service.save({ startingYear: 2027 });
    releaseInsert();
    await Promise.all([first, second]);

    const saved = await testStore.store.list<Settings>(COLLECTIONS.settings);
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2027);
  });
});
