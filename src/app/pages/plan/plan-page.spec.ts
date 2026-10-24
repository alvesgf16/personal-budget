import type { BudgetCell } from '../../../data/domains/budget-cell/budget-cell';
import type { Category } from '../../../data/domains/category/category';
import { COLLECTIONS } from '../../../data/store/types';
import { provideDocumentStoreHarness } from '../../../data/store/document-store/document-store.harness';
import { PlanPage } from './plan-page';
import { planHarness } from './plan-page.harness';

describe('Plan year header', () => {
  const storeHarness = provideDocumentStoreHarness('pb-19-plan', { imports: [PlanPage] });
  const { seedStartingYear, renderPlan, headerText } = planHarness(storeHarness);

  it('does not invent a year when none is saved', async () => {
    const fixture = await renderPlan();

    expect(headerText(fixture)).toBe('Plan');
    expect(fixture.nativeElement.textContent).not.toMatch(/\d{4}/);
  });

  it('shows the stored starting year in the header', async () => {
    await seedStartingYear(2026);

    const fixture = await renderPlan();

    expect(headerText(fixture)).toBe('2026');
  });
});

describe('Plan category sections', () => {
  const storeHarness = provideDocumentStoreHarness('pb-53-plan', { imports: [PlanPage] });
  const {
    seedStartingYear,
    renderPlan,
    submitInSection,
    enterExpenseAndSavingsJanuary,
    sectionTypes,
    sectionHeading,
    listNames,
    inputByAriaLabel,
  } = planHarness(storeHarness);

  it('renders income, expense, and savings sections', async () => {
    const fixture = await renderPlan();

    expect(sectionTypes(fixture)).toEqual(['income', 'expense', 'savings']);
    expect(sectionHeading(fixture, 'income')).toBe('Income');
    expect(sectionHeading(fixture, 'expense')).toBe('Expenses');
    expect(sectionHeading(fixture, 'savings')).toBe('Savings');
  });

  it('keeps an expense add inside the expense section only', async () => {
    const fixture = await renderPlan();

    await submitInSection(fixture, 'expense', 'Rent');

    expect(listNames(fixture, 'expense')).toEqual(['Rent']);
    expect(listNames(fixture, 'income')).toEqual([]);
    expect(listNames(fixture, 'savings')).toEqual([]);
  });

  it('persists expense and savings January amounts as separate budget cells', async () => {
    await seedStartingYear(2026);
    const fixture = await renderPlan();

    await enterExpenseAndSavingsJanuary(fixture);
    const categories = await storeHarness.store.list<Category>(COLLECTIONS.categories);
    const rent = categories.find(
      (category) => category.type === 'expense' && category.name === 'Rent',
    );
    const emergency = categories.find(
      (category) => category.type === 'savings' && category.name === 'Emergency',
    );
    const cells = await storeHarness.store.list<BudgetCell>(COLLECTIONS.budgetCells);

    expect(rent).toBeDefined();
    expect(emergency).toBeDefined();
    expect(cells).toHaveLength(2);
    expect(cells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: rent!.id,
          year: 2026,
          month: 1,
          amountCents: 120_000,
        }),
        expect.objectContaining({
          categoryId: emergency!.id,
          year: 2026,
          month: 1,
          amountCents: 30_000,
        }),
      ]),
    );
  });

  it('reloads saved January amounts after remounting Plan', async () => {
    await seedStartingYear(2026);
    const first = await renderPlan();
    await enterExpenseAndSavingsJanuary(first);
    first.destroy();

    const second = await renderPlan();
    await second.whenStable();
    second.detectChanges();
    const rentJanuary = inputByAriaLabel(second, 'Rent January');
    const emergencyJanuary = inputByAriaLabel(second, 'Emergency January');
    const rentFebruary = inputByAriaLabel(second, 'Rent February');

    expect(rentJanuary?.value).toBe('1200');
    expect(emergencyJanuary?.value).toBe('300');
    expect(rentFebruary?.value).toBe('');
  });
});
