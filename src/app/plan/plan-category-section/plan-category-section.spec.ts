import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { BudgetCell } from '../../../data/domains/budget-cell/budget-cell';
import { COLLECTIONS } from '../../../data/store/types';
import { provideTestDocumentStore } from '../../../data/store/document-store/document-store.testing';
import { PlanCategorySection } from './plan-category-section';

describe('PlanCategorySection', () => {
  const testDb = provideTestDocumentStore('pb-21-plan-section', {
    imports: [PlanCategorySection],
  });

  const render = async (year: number | null = null) => {
    const fixture = TestBed.createComponent(PlanCategorySection);
    fixture.componentRef.setInput('type', 'income');
    fixture.componentRef.setInput('year', year);
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

  it('adds an income category as a list row', async () => {
    const fixture = await render();
    await submitName(fixture, 'Salary');

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    const items = [...fixture.nativeElement.querySelectorAll('li')].map((el: Element) =>
      el.textContent?.trim(),
    );
    expect(items).toEqual(['Salary']);

    const saved = await testDb.store.list(COLLECTIONS.categories);
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
    expect(await testDb.store.list(COLLECTIONS.categories)).toEqual([]);
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
    testDb.store.insert = async () => {
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
    expect(await testDb.store.list(COLLECTIONS.categories)).toEqual([]);
  });

  it('saves January without changing February', async () => {
    const fixture = await render(2026);
    await submitName(fixture, 'Salary');
    await setCell(fixture, 'Salary January', '1000');

    const cells = await testDb.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({ year: 2026, month: 1, amountCents: 100_000 });

    const february = fixture.nativeElement.querySelector(
      'input[aria-label="Salary February"]',
    ) as HTMLInputElement;
    expect(february.value).toBe('');
  });

  it('reloads saved January amount after recreating the section', async () => {
    const first = await render(2026);
    await submitName(first, 'Salary');
    await setCell(first, 'Salary January', '2500.50');
    first.destroy();

    const second = await render(2026);
    await second.whenStable();
    second.detectChanges();

    const january = second.nativeElement.querySelector(
      'input[aria-label="Salary January"]',
    ) as HTMLInputElement;
    expect(january.value).toBe('2500.50');
  });
});
