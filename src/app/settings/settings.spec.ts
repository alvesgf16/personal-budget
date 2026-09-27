import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/collections';
import { provideTestDocumentStore } from '../../data/document-store.testing';
import type { Settings as SettingsPayload } from '../../data/settings';
import { Plan } from '../plan/plan';
import { Settings } from './settings';

describe('Settings starting year', () => {
  const testDb = provideTestDocumentStore('pb-19-settings', { imports: [Settings, Plan] });

  const renderSettings = async () => {
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const submitYear = async (fixture: ComponentFixture<Settings>, year: string) => {
    await startSubmit(fixture, year);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('does not save an empty or invalid year', async () => {
    const fixture = await renderSettings();

    await submitYear(fixture, '');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('1900');
    expect(await testDb.store.list(COLLECTIONS.settings)).toEqual([]);

    await submitYear(fixture, '1899');
    expect(await testDb.store.list(COLLECTIONS.settings)).toEqual([]);

    await submitYear(fixture, '2026.5');
    expect(await testDb.store.list(COLLECTIONS.settings)).toEqual([]);
  });

  it('saves a starting year that Plan shows after a fresh load', async () => {
    const settingsFixture = await renderSettings();
    await submitYear(settingsFixture, '2026');
    expect(settingsFixture.nativeElement.querySelector('[role="alert"]')).toBeNull();

    const saved = await testDb.store.list<SettingsPayload>(COLLECTIONS.settings);
    expect(saved).toHaveLength(1);
    expect(saved[0]?.startingYear).toBe(2026);

    await submitYear(settingsFixture, '2027');
    const updated = await testDb.store.list<SettingsPayload>(COLLECTIONS.settings);
    expect(updated).toHaveLength(1);
    expect(updated[0]?.startingYear).toBe(2027);
    settingsFixture.destroy();

    const planFixture = TestBed.createComponent(Plan);
    planFixture.detectChanges();
    await planFixture.whenStable();
    planFixture.detectChanges();
    expect(planFixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('2027');
  });

  it('shows an error when save persistence fails', async () => {
    testDb.store.insert = async () => {
      throw new Error('unavailable');
    };

    const fixture = await renderSettings();
    await submitYear(fixture, '2026');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not save',
    );
    expect(await testDb.store.list(COLLECTIONS.settings)).toEqual([]);
  });

  it('shows an error when settings cannot be loaded', async () => {
    testDb.store.list = async () => {
      throw new Error('unavailable');
    };

    const fixture = await renderSettings();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not load',
    );
  });
});

async function startSubmit(fixture: ComponentFixture<Settings>, year: string): Promise<void> {
  const input = fixture.nativeElement.querySelector('#starting-year') as HTMLInputElement;
  input.value = year;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
}
