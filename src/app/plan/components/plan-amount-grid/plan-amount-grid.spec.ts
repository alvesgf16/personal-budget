import { COLLECTIONS } from '../../../../data/store/types';
import { provideDocumentStoreHarness } from '../../../../data/store/document-store/document-store.harness';
import { PlanAmountGrid } from './plan-amount-grid';
import { planAmountGridHarness } from './plan-amount-grid.harness';

describe('PlanAmountGrid', () => {
  const storeHarness = provideDocumentStoreHarness('pb-21-amount-grid', {
    imports: [PlanAmountGrid],
  });
  const {
    insertCategory,
    insertCell,
    render,
    outputText,
    inputByAriaLabel,
    typeCell,
    commitCell,
    holdFirstBudgetCellList,
    startGridLoadWithoutWaiting,
  } = planAmountGridHarness(storeHarness);

  it('ignores a stale load when year changes mid-flight', async () => {
    const salary = await insertCategory('Salary');
    await insertCell(salary.id, 2026, 1, 100_000);
    await insertCell(salary.id, 2027, 1, 200_000);
    const { releaseFirst } = holdFirstBudgetCellList();
    const fixture = await startGridLoadWithoutWaiting([salary], 2026);

    fixture.componentRef.setInput('year', 2027);
    fixture.detectChanges();
    releaseFirst();
    await fixture.whenStable();
    fixture.detectChanges();
    const january = inputByAriaLabel(fixture, 'Salary January');

    expect(january?.value).toBe('2000');
  });

  describe('totals', () => {
    it('does not update totals or persist while typing before blur', async () => {
      const salary = await insertCategory('Salary');
      const fixture = await render([salary]);

      typeCell(fixture, 'Salary January', '1000');
      const cells = await storeHarness.store.list(COLLECTIONS.budgetCells);

      expect(outputText(fixture, 'Salary year total')).toBe('0');
      expect(cells).toEqual([]);
    });

    it('updates totals when a cell commits on blur', async () => {
      const salary = await insertCategory('Salary');
      const fixture = await render([salary]);

      await commitCell(fixture, 'Salary January', '1000');
      const cells = await storeHarness.store.list(COLLECTIONS.budgetCells);

      expect(outputText(fixture, 'Salary year total')).toBe('1000');
      expect(outputText(fixture, 'Total January')).toBe('1000');
      expect(cells).toHaveLength(1);
      expect(cells[0]).toMatchObject({ month: 1, amountCents: 100_000 });
    });

    it('does not include other-section cells in this section total', async () => {
      const salary = await insertCategory('Salary');
      const rent = await insertCategory('Rent', { type: 'expense' });
      await insertCell(salary.id, 2026, 1, 10_000);
      await insertCell(rent.id, 2026, 1, 99_900);

      const fixture = await render([salary]);

      expect(outputText(fixture, 'Total January')).toBe('100');
    });
  });
});
