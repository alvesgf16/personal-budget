import { COLLECTIONS } from '../../../../data/store/types';
import { provideTestDocumentStore } from '../../../../data/store/document-store/document-store.testing';
import { PlanAmountGrid } from './plan-amount-grid';
import { planAmountGridHarness } from './plan-amount-grid.testing';

describe('PlanAmountGrid totals', () => {
  const testDb = provideTestDocumentStore('pb-32-amount-grid', { imports: [PlanAmountGrid] });
  const { insertCategory, render, outputText } = planAmountGridHarness(testDb);

  it('updates totals when a cell changes without storing a total document', async () => {
    const salary = await insertCategory('Salary');
    const fixture = await render([salary]);

    const january = fixture.nativeElement.querySelector(
      'input[aria-label="Salary January"]',
    ) as HTMLInputElement;
    january.value = '1000';
    january.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(outputText(fixture, 'Salary year total')).toBe('0');
    expect(await testDb.store.list(COLLECTIONS.budgetCells)).toEqual([]);

    january.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(outputText(fixture, 'Salary year total')).toBe('1000');
    expect(outputText(fixture, 'Total January')).toBe('1000');
    const cells = await testDb.store.list(COLLECTIONS.budgetCells);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({ month: 1, amountCents: 100_000 });
  });

  it('excludes hidden categories from section totals', async () => {
    const salary = await insertCategory('Salary', { sortOrder: 0 });
    const hidden = await insertCategory('Old job', { sortOrder: 1, active: false });
    await testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2026,
      month: 1,
      amountCents: 10_000,
    });
    await testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId: hidden.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });

    const fixture = await render([salary, hidden]);
    expect(outputText(fixture, 'Salary year total')).toBe('100');
    expect(outputText(fixture, 'Old job year total')).toBe('1000');
    expect(outputText(fixture, 'Total January')).toBe('100');
  });

  it('does not include other-section cells in this section total', async () => {
    const salary = await insertCategory('Salary');
    const rent = await insertCategory('Rent', { type: 'expense' });
    await testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId: salary.id,
      year: 2026,
      month: 1,
      amountCents: 10_000,
    });
    await testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId: rent.id,
      year: 2026,
      month: 1,
      amountCents: 99_900,
    });

    const fixture = await render([salary]);
    expect(outputText(fixture, 'Total January')).toBe('100');
  });
});
