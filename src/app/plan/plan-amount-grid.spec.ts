import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/collections';
import type { Category } from '../../data/category';
import type { StoreDocument } from '../../data/document';
import { provideTestDocumentStore } from '../../data/document-store.testing';
import type { DocumentStore } from '../../data/store';
import { PlanAmountGrid } from './plan-amount-grid';

describe('PlanAmountGrid', () => {
  const testDb = provideTestDocumentStore('pb-21-amount-grid', { imports: [PlanAmountGrid] });

  it('ignores a stale load when year changes mid-flight', async () => {
    const salary = (await testDb.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Salary',
      sortOrder: 0,
      active: true,
    })) as StoreDocument<Category>;
    await testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
    await testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2027,
      month: 1,
      amountCents: 200_000,
    });

    let releaseFirst!: () => void;
    const firstListGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const originalList = testDb.store.list.bind(testDb.store);
    let listCalls = 0;
    testDb.store.list = async <T extends object>(
      collection: Parameters<DocumentStore['list']>[0],
    ) => {
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
