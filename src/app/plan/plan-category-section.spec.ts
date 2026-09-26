import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/collections';
import { DOCUMENT_STORE } from '../../data/document-store.token';
import { createDocumentStore, type DocumentStore } from '../../data/store';
import { PlanCategorySection } from './plan-category-section';

describe('PlanCategorySection', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(async () => {
    dbName = `pb-20-plan-section-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
    await TestBed.configureTestingModule({
      imports: [PlanCategorySection],
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    }).compileComponents();
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(PlanCategorySection);
    fixture.componentRef.setInput('type', 'income');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const submitName = async (fixture: ComponentFixture<PlanCategorySection>, name: string) => {
    const input = fixture.nativeElement.querySelector('#category-name-income') as HTMLInputElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('adds an income category as a list row', async () => {
    const fixture = await render();
    await submitName(fixture, 'Salary');

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    const items = [...fixture.nativeElement.querySelectorAll('li')].map((el: Element) =>
      el.textContent?.trim(),
    );
    expect(items).toEqual(['Salary']);

    const saved = await store.list(COLLECTIONS.categories);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ type: 'income', name: 'Salary', sortOrder: 0, active: true });
  });

  it('does not persist a blank name and shows an alert', async () => {
    const fixture = await render();
    await submitName(fixture, '   ');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'category name',
    );
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
    expect(await store.list(COLLECTIONS.categories)).toEqual([]);
  });

  it('keeps add order across two income categories', async () => {
    const fixture = await render();
    await submitName(fixture, 'Salary');
    await submitName(fixture, 'Bonus');

    const items = [...fixture.nativeElement.querySelectorAll('li')].map((el: Element) =>
      el.textContent?.trim(),
    );
    expect(items).toEqual(['Salary', 'Bonus']);
  });

  it('shows an error when add persistence fails and keeps the draft', async () => {
    store.insert = async () => {
      throw new Error('unavailable');
    };

    const fixture = await render();
    await submitName(fixture, 'Salary');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not save',
    );
    expect(
      (fixture.nativeElement.querySelector('#category-name-income') as HTMLInputElement).value,
    ).toBe('Salary');
    expect(await store.list(COLLECTIONS.categories)).toEqual([]);
  });
});
