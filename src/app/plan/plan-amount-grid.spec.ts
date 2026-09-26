import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/collections';
import type { Category } from '../../data/category';
import type { StoreDocument } from '../../data/document';
import { DOCUMENT_STORE } from '../../data/document-store.token';
import { createDocumentStore, type DocumentStore } from '../../data/store';
import { PlanAmountGrid } from './plan-amount-grid';

describe('PlanAmountGrid', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(async () => {
    dbName = `pb-21-amount-grid-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
    await TestBed.configureTestingModule({
      imports: [PlanAmountGrid],
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    }).compileComponents();
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('ignores a stale load when year changes mid-flight', async () => {
    const salary = (await store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Salary',
      sortOrder: 0,
      active: true,
    })) as StoreDocument<Category>;
    await store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
    await store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2027,
      month: 1,
      amountCents: 200_000,
    });

    let releaseFirst!: () => void;
    const firstListGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const originalList = store.list.bind(store);
    let listCalls = 0;
    store.list = async <T extends object>(collection: Parameters<DocumentStore['list']>[0]) => {
      const rows = await originalList<T>(collection);
      if (collection === COLLECTIONS.budgetCells) {
        listCalls += 1;
        if (listCalls === 1) {
          await firstListGate;
        }
      }
      return rows;
    };

    const fixture = TestBed.createComponent(PlanAmountGrid);
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('rows', [salary]);
    fixture.detectChanges();
    await Promise.resolve();

    fixture.componentRef.setInput('year', 2027);
    fixture.detectChanges();
    releaseFirst();
    await fixture.whenStable();
    fixture.detectChanges();

    const january = fixture.nativeElement.querySelector(
      'input[aria-label="Salary January"]',
    ) as HTMLInputElement;
    expect(january.value).toBe('2000');
  });
});
