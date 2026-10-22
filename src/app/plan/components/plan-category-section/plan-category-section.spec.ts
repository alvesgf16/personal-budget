import type { BudgetCell } from '../../../../data/domains/budget-cell/budget-cell';
import type { Category } from '../../../../data/domains/category/category';
import { COLLECTIONS } from '../../../../data/store/types';
import {
  deferFirstStoreCategoryList,
  provideDocumentStoreHarness,
} from '../../../../data/store/document-store/document-store.harness';
import { PlanCategorySection } from './plan-category-section';
import { planCategorySectionHarness } from './plan-category-section.harness';

describe('PlanCategorySection', () => {
  const storeHarness = provideDocumentStoreHarness('pb-21-plan-section', {
    imports: [PlanCategorySection],
  });
  const {
    render,
    startSectionLoadWithoutWaiting,
    submitName,
    submitNameWithoutWaiting,
    setCell,
    renameByAriaLabel,
    clickNamedButton,
    listItems,
    outputText,
    alertText,
    inputByAriaLabel,
    buttonByAriaLabel,
    draftNameValue,
    hiddenCategoriesText,
  } = planCategorySectionHarness();

  (
    [
      ['income', 'Salary', 'Bonus'],
      ['expense', 'Rent', 'Groceries'],
      ['savings', 'Emergency', 'Vacation'],
    ] as const
  ).forEach(([type, first, second]) => {
    it(`adds a ${type} category as a list row`, async () => {
      const fixture = await render(type);

      await submitName(fixture, type, first);
      const saved = await storeHarness.store.list(COLLECTIONS.categories);

      expect(alertText(fixture)).toBeNull();
      expect(listItems(fixture)).toEqual([first]);
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({ type, name: first, sortOrder: 0, active: true });
    });

    it(`keeps add order across two ${type} categories`, async () => {
      const fixture = await render(type);

      await submitName(fixture, type, first);
      await submitName(fixture, type, second);

      expect(listItems(fixture)).toEqual([first, second]);
    });
  });

  it('ignores a stale load when a mutation refresh finishes first', async () => {
    const {
      whenFirstListArrives,
      whenSiblingListCompletes,
      armNextListWatch,
      whenNextListCompletes,
      releaseFirstList,
    } = deferFirstStoreCategoryList(storeHarness);
    const fixture = await startSectionLoadWithoutWaiting('income');

    await whenFirstListArrives;
    await whenSiblingListCompletes;
    submitNameWithoutWaiting(fixture, 'income', 'Salary');
    // Add pre-insert list + active and hidden refresh lists.
    armNextListWatch(3);
    await whenNextListCompletes;
    releaseFirstList();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listItems(fixture)).toEqual(['Salary']);
  });

  it('does not persist a blank name and shows an alert', async () => {
    const fixture = await render();

    await submitName(fixture, 'income', '   ');
    const saved = await storeHarness.store.list(COLLECTIONS.categories);

    expect(alertText(fixture)).toContain('category name');
    expect(listItems(fixture)).toEqual([]);
    expect(saved).toEqual([]);
  });

  it('shows an error when add persistence fails and keeps the draft', async () => {
    storeHarness.store.insert = () => Promise.reject(new Error('unavailable'));
    const fixture = await render();

    await submitName(fixture, 'income', 'Salary');
    const saved = await storeHarness.store.list(COLLECTIONS.categories);

    expect(alertText(fixture)).toContain('Could not save');
    expect(draftNameValue(fixture, 'income')).toBe('Salary');
    expect(saved).toEqual([]);
  });

  it('renames in the list without changing sortOrder', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');

    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');
    const saved = await storeHarness.store.list(COLLECTIONS.categories);

    expect(listItems(fixture)).toEqual(['Paycheck']);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Paycheck',
      sortOrder: 0,
      type: 'income',
      active: true,
    });
  });

  it('renames in the grid and updates rename and cell aria-labels', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');

    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');

    expect(inputByAriaLabel(fixture, 'Rename Paycheck')?.value).toBe('Paycheck');
    expect(inputByAriaLabel(fixture, 'Paycheck January')).not.toBeNull();
  });

  it('keeps budgetCells intact when renaming in the grid', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');

    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');
    const cells = await storeHarness.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    const categories = await storeHarness.store.list<Category>(COLLECTIONS.categories);

    expect(categories[0]?.name).toBe('Paycheck');
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({
      categoryId: categories[0]!.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
  });

  it('shows an error when rename persistence fails', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');
    storeHarness.store.update = () => Promise.reject(new Error('unavailable'));

    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');
    const saved = await storeHarness.store.list<Category>(COLLECTIONS.categories);

    expect(alertText(fixture)).toContain('Could not save');
    expect(saved[0]?.name).toBe('Salary');
  });

  it('hides in the list and lists the category under Hidden', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');

    await clickNamedButton(fixture, 'Hide Salary');

    expect(listItems(fixture)).toEqual([]);
    expect(hiddenCategoriesText(fixture)).toContain('Salary');
    expect(buttonByAriaLabel(fixture, 'Unhide Salary')).not.toBeNull();
  });

  it('marks a hidden list category inactive without removing the row', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');

    await clickNamedButton(fixture, 'Hide Salary');
    const saved = await storeHarness.store.list<Category>(COLLECTIONS.categories);

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: 'Salary', active: false, sortOrder: 0 });
  });

  it('hides in the grid, drops section totals, and shows Hidden', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');

    await clickNamedButton(fixture, 'Hide Salary');

    expect(inputByAriaLabel(fixture, 'Salary January')).toBeNull();
    expect(outputText(fixture, 'Total January')).toBe('0');
    expect(hiddenCategoriesText(fixture)).toContain('Salary');
  });

  it('leaves budgetCells intact when hiding in the grid', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');

    await clickNamedButton(fixture, 'Hide Salary');
    const cells = await storeHarness.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    const categories = await storeHarness.store.list<Category>(COLLECTIONS.categories);

    expect(categories[0]?.active).toBe(false);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({
      categoryId: categories[0]!.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
  });

  it('unhides a category and restores its January amount in the grid', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');
    await clickNamedButton(fixture, 'Hide Salary');

    await clickNamedButton(fixture, 'Unhide Salary');
    const saved = await storeHarness.store.list<Category>(COLLECTIONS.categories);

    expect(hiddenCategoriesText(fixture)).toBeNull();
    expect(inputByAriaLabel(fixture, 'Salary January')?.value).toBe('1000');
    expect(outputText(fixture, 'Total January')).toBe('1000');
    expect(saved[0]?.active).toBe(true);
  });

  it('shows an error when hide persistence fails and keeps the row', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');
    storeHarness.store.update = () => Promise.reject(new Error('unavailable'));

    await clickNamedButton(fixture, 'Hide Salary');
    const saved = await storeHarness.store.list<Category>(COLLECTIONS.categories);

    expect(alertText(fixture)).toContain('Could not save');
    expect(listItems(fixture)).toEqual(['Salary']);
    expect(saved[0]?.active).toBe(true);
  });

  (
    [
      ['income', 'Salary'],
      ['expense', 'Rent'],
      ['savings', 'Emergency'],
    ] as const
  ).forEach(([type, name]) => {
    it(`saves ${type} January without changing February`, async () => {
      const fixture = await render(type, 2026);
      await submitName(fixture, type, name);

      await setCell(fixture, `${name} January`, '1000');
      const cells = await storeHarness.store.list<BudgetCell>(COLLECTIONS.budgetCells);

      expect(cells).toHaveLength(1);
      expect(cells[0]).toMatchObject({ year: 2026, month: 1, amountCents: 100_000 });
      expect(inputByAriaLabel(fixture, `${name} February`)?.value).toBe('');
    });

    it(`reloads saved ${type} January amount after recreating the section`, async () => {
      const first = await render(type, 2026);
      await submitName(first, type, name);
      await setCell(first, `${name} January`, '2500.50');
      first.destroy();

      const second = await render(type, 2026);
      await second.whenStable();
      second.detectChanges();

      expect(inputByAriaLabel(second, `${name} January`)?.value).toBe('2500.50');
    });
  });
});
