import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../../../data/store/types';
import { provideTestDocumentStore } from '../../../../data/store/document-store/document-store.testing';
import type { DocumentStore } from '../../../../data/store/document-store/document-store';
import { PlanAmountGrid } from './plan-amount-grid';
import { planAmountGridHarness } from './plan-amount-grid.testing';

describe('PlanAmountGrid', () => {
  const testStore = provideTestDocumentStore('pb-21-amount-grid', { imports: [PlanAmountGrid] });
  const { insertCategory, render, outputText } = planAmountGridHarness(testStore);

  it('ignores a stale load when year changes mid-flight', async () => {
    const salary = await insertCategory('Salary');
    await testStore.store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
    await testStore.store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2027,
      month: 1,
      amountCents: 200_000,
    });

    let releaseFirst!: () => void;
    const firstListGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const originalList = testStore.store.list.bind(testStore.store);
    let listCalls = 0;
    testStore.store.list = async <T extends object>(
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
    fixture.componentRef.setInput('categories', [salary]);
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

  describe('totals', () => {
    it('updates totals when a cell commits without storing a total document', async () => {
      const salary = await insertCategory('Salary');
      const fixture = await render([salary]);

      const january = fixture.nativeElement.querySelector(
        'input[aria-label="Salary January"]',
      ) as HTMLInputElement;
      january.value = '1000';
      january.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(outputText(fixture, 'Salary year total')).toBe('0');
      expect(await testStore.store.list(COLLECTIONS.budgetCells)).toEqual([]);

      january.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outputText(fixture, 'Salary year total')).toBe('1000');
      expect(outputText(fixture, 'Total January')).toBe('1000');
      const cells = await testStore.store.list(COLLECTIONS.budgetCells);
      expect(cells).toHaveLength(1);
      expect(cells[0]).toMatchObject({ month: 1, amountCents: 100_000 });
    });

    it('does not include other-section cells in this section total', async () => {
      const salary = await insertCategory('Salary');
      const rent = await insertCategory('Rent', { type: 'expense' });
      await testStore.store.insert(COLLECTIONS.budgetCells, {
        categoryId: salary.id,
        year: 2026,
        month: 1,
        amountCents: 10_000,
      });
      await testStore.store.insert(COLLECTIONS.budgetCells, {
        categoryId: rent.id,
        year: 2026,
        month: 1,
        amountCents: 99_900,
      });

      const fixture = await render([salary]);
      expect(outputText(fixture, 'Total January')).toBe('100');
    });
  });
});
