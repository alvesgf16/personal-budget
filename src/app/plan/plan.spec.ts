import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/collections';
import { DOCUMENT_STORE } from '../../data/document-store.token';
import { createDocumentStore, type DocumentStore } from '../../data/store';
import { Plan } from './plan';

describe('Plan year header', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(async () => {
    dbName = `pb-19-plan-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
    await TestBed.configureTestingModule({
      imports: [Plan],
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    }).compileComponents();
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('does not invent a year when none is saved', async () => {
    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Plan');
    expect(fixture.nativeElement.textContent).not.toMatch(/\d{4}/);
  });

  it('shows the stored starting year in the header', async () => {
    await store.insert(COLLECTIONS.settings, { startingYear: 2026 });

    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('2026');
  });
});
