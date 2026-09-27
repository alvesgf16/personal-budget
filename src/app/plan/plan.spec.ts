import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/store/types';
import { provideTestDocumentStore } from '../../data/store/document-store/document-store.testing';
import { Plan } from './plan';

describe('Plan year header', () => {
  const testDb = provideTestDocumentStore('pb-19-plan', { imports: [Plan] });

  it('does not invent a year when none is saved', async () => {
    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Plan');
    expect(fixture.nativeElement.textContent).not.toMatch(/\d{4}/);
  });

  it('shows the stored starting year in the header', async () => {
    await testDb.store.insert(COLLECTIONS.settings, { startingYear: 2026 });

    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('2026');
  });
});
