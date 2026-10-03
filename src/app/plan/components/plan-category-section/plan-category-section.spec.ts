import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { BudgetCell } from '../../../../data/domains/budget-cell/budget-cell';
import type { Category, CategoryType } from '../../../../data/domains/category/category';
import { COLLECTIONS } from '../../../../data/store/types';
import { provideTestDocumentStore } from '../../../../data/store/document-store/document-store.testing';
import { PlanCategorySection } from './plan-category-section';

describe('PlanCategorySection', () => {
  const testStore = provideTestDocumentStore('pb-21-plan-section', {
    imports: [PlanCategorySection],
  });

  const render = async (type: CategoryType = 'income', year: number | null = null) => {
    const fixture = TestBed.createComponent(PlanCategorySection);
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('year', year);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const submitName = async (
    fixture: ComponentFixture<PlanCategorySection>,
    type: CategoryType,
    name: string,
  ) => {
    const input = fixture.nativeElement.querySelector(`#category-name-${type}`) as HTMLInputElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setCell = async (
    fixture: ComponentFixture<PlanCategorySection>,
    ariaLabel: string,
    value: string,
  ) => {
    const input = fixture.nativeElement.querySelector(
      `input[aria-label="${ariaLabel}"]`,
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const renameByAriaLabel = async (
    fixture: ComponentFixture<PlanCategorySection>,
    currentName: string,
    nextName: string,
  ) => {
    const input = fixture.nativeElement.querySelector(
      `input[aria-label="Rename ${currentName}"]`,
    ) as HTMLInputElement;
    input.value = nextName;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const clickNamedButton = async (
    fixture: ComponentFixture<PlanCategorySection>,
    ariaLabel: string,
  ) => {
    const button = fixture.nativeElement.querySelector(
      `button[aria-label="${ariaLabel}"]`,
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const listItems = (fixture: ComponentFixture<PlanCategorySection>) =>
    [...fixture.nativeElement.querySelectorAll('.active-categories li input')].map(
      (el: Element) => (el as HTMLInputElement).value,
    );

  const outputText = (fixture: ComponentFixture<PlanCategorySection>, ariaLabel: string) =>
    (
      fixture.nativeElement.querySelector(`output[aria-label="${ariaLabel}"]`) as HTMLElement | null
    )?.textContent?.trim() ?? '';

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

      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(listItems(fixture)).toEqual([first]);

      const saved = await testStore.store.list(COLLECTIONS.categories);
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

  it('does not persist a blank name and shows an alert', async () => {
    const fixture = await render();
    await submitName(fixture, 'income', '   ');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'category name',
    );
    expect(listItems(fixture)).toEqual([]);
    expect(await testStore.store.list(COLLECTIONS.categories)).toEqual([]);
  });

  it('shows an error when add persistence fails and keeps the draft', async () => {
    testStore.store.insert = async () => {
      throw new Error('unavailable');
    };

    const fixture = await render();
    await submitName(fixture, 'income', 'Salary');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not save',
    );
    expect(
      (fixture.nativeElement.querySelector('#category-name-income') as HTMLInputElement).value,
    ).toBe('Salary');
    expect(await testStore.store.list(COLLECTIONS.categories)).toEqual([]);
  });

  it('renames in the list without changing sortOrder', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');
    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');

    expect(listItems(fixture)).toEqual(['Paycheck']);
    const saved = await testStore.store.list(COLLECTIONS.categories);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Paycheck',
      sortOrder: 0,
      type: 'income',
      active: true,
    });
  });

  it('renames in the grid, updates aria-labels, and leaves budgetCells intact', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');
    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');

    expect(
      (
        fixture.nativeElement.querySelector(
          'input[aria-label="Rename Paycheck"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('Paycheck');
    expect(
      fixture.nativeElement.querySelector('input[aria-label="Paycheck January"]'),
    ).not.toBeNull();

    const cells = await testStore.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    const categories = await testStore.store.list<Category>(COLLECTIONS.categories);
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

    testStore.store.update = async () => {
      throw new Error('unavailable');
    };
    await renameByAriaLabel(fixture, 'Salary', 'Paycheck');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not save',
    );
    const saved = await testStore.store.list<Category>(COLLECTIONS.categories);
    expect(saved[0]?.name).toBe('Salary');
  });

  it('hides in the list, keeps budgetCells, and lists the category under Hidden', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');
    await clickNamedButton(fixture, 'Hide Salary');

    expect(listItems(fixture)).toEqual([]);
    expect(fixture.nativeElement.querySelector('.hidden-categories')?.textContent).toContain(
      'Salary',
    );
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Unhide Salary"]'),
    ).not.toBeNull();

    const saved = await testStore.store.list<Category>(COLLECTIONS.categories);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: 'Salary', active: false, sortOrder: 0 });
  });

  it('hides in the grid, drops section totals, and leaves budgetCells intact', async () => {
    const fixture = await render('income', 2026);
    await submitName(fixture, 'income', 'Salary');
    await setCell(fixture, 'Salary January', '1000');
    expect(outputText(fixture, 'Total January')).toBe('1000');

    await clickNamedButton(fixture, 'Hide Salary');

    expect(fixture.nativeElement.querySelector('input[aria-label="Salary January"]')).toBeNull();
    expect(outputText(fixture, 'Total January')).toBe('0');
    expect(fixture.nativeElement.querySelector('.hidden-categories')?.textContent).toContain(
      'Salary',
    );

    const cells = await testStore.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    const categories = await testStore.store.list<Category>(COLLECTIONS.categories);
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

    expect(fixture.nativeElement.querySelector('.hidden-categories')).toBeNull();
    const january = fixture.nativeElement.querySelector(
      'input[aria-label="Salary January"]',
    ) as HTMLInputElement;
    expect(january.value).toBe('1000');
    expect(outputText(fixture, 'Total January')).toBe('1000');

    const saved = await testStore.store.list<Category>(COLLECTIONS.categories);
    expect(saved[0]?.active).toBe(true);
  });

  it('shows an error when hide persistence fails and keeps the row', async () => {
    const fixture = await render('income');
    await submitName(fixture, 'income', 'Salary');

    testStore.store.update = async () => {
      throw new Error('unavailable');
    };
    await clickNamedButton(fixture, 'Hide Salary');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not save',
    );
    expect(listItems(fixture)).toEqual(['Salary']);
    const saved = await testStore.store.list<Category>(COLLECTIONS.categories);
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

      const cells = await testStore.store.list<BudgetCell>(COLLECTIONS.budgetCells);
      expect(cells).toHaveLength(1);
      expect(cells[0]).toMatchObject({ year: 2026, month: 1, amountCents: 100_000 });

      const february = fixture.nativeElement.querySelector(
        `input[aria-label="${name} February"]`,
      ) as HTMLInputElement;
      expect(february.value).toBe('');
    });

    it(`reloads saved ${type} January amount after recreating the section`, async () => {
      const first = await render(type, 2026);
      await submitName(first, type, name);
      await setCell(first, `${name} January`, '2500.50');
      first.destroy();

      const second = await render(type, 2026);
      await second.whenStable();
      second.detectChanges();

      const january = second.nativeElement.querySelector(
        `input[aria-label="${name} January"]`,
      ) as HTMLInputElement;
      expect(january.value).toBe('2500.50');
    });
  });
});
