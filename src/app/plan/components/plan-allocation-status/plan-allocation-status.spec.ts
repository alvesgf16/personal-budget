import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { BudgetCell } from '../../../../data/domains/budget-cell/budget-cell';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import type { Category } from '../../../../data/domains/category/category';
import { CategoryService } from '../../../../data/domains/category/category.service';
import type { DocumentStore } from '../../../../data/store/document-store/document-store';
import { COLLECTIONS } from '../../../../data/store/types';
import { provideTestDocumentStore } from '../../../../data/store/document-store/document-store.testing';
import { Plan } from '../../plan';
import { PlanAllocationStatus } from './plan-allocation-status';

describe('PlanAllocationStatus', () => {
  const testDb = provideTestDocumentStore('pb-22-allocation-status', {
    imports: [PlanAllocationStatus, Plan],
  });

  const insertCategory = (
    type: Category['type'],
    name: string,
    extras: Partial<Pick<Category, 'active' | 'sortOrder'>> = {},
  ) =>
    testDb.store.insert(COLLECTIONS.categories, {
      type,
      name,
      sortOrder: extras.sortOrder ?? 0,
      active: extras.active ?? true,
    });

  const insertCell = (categoryId: string, month: number, amountCents: number) =>
    testDb.store.insert(COLLECTIONS.budgetCells, {
      categoryId,
      year: 2026,
      month,
      amountCents,
    });

  const renderStrip = async () => {
    const fixture = TestBed.createComponent(PlanAllocationStatus);
    fixture.componentRef.setInput('year', 2026);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const statusFor = (fixture: ComponentFixture<PlanAllocationStatus>, monthLong: string) => {
    const state = fixture.nativeElement.querySelector(
      `span[aria-label="${monthLong} allocation"]`,
    ) as HTMLElement | null;
    const li = state?.closest('li');
    return {
      text: state?.textContent?.trim() ?? '',
      status: li?.getAttribute('data-status') ?? '',
    };
  };

  it('shows Complete for a zero-remaining January with real inputs; other months stay untouched', async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    const emergency = await insertCategory('savings', 'Emergency');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 70_000);
    await insertCell(emergency.id, 1, 30_000);

    const fixture = await renderStrip();

    expect(statusFor(fixture, 'January')).toEqual({ text: 'Complete', status: 'balanced' });
    expect(statusFor(fixture, 'February')).toEqual({ text: 'Not started', status: 'untouched' });
  });

  it('shows a warning state when a month is over-allocated', async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 120_000);

    const fixture = await renderStrip();

    expect(statusFor(fixture, 'January')).toEqual({ text: '200 over', status: 'over' });
  });

  it('reloads when a category is hidden so its amounts leave the strip', async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    const emergency = await insertCategory('savings', 'Emergency');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 70_000);
    await insertCell(emergency.id, 1, 30_000);

    const fixture = await renderStrip();
    expect(statusFor(fixture, 'January')).toEqual({ text: 'Complete', status: 'balanced' });

    await TestBed.inject(CategoryService).hide(salary.id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(statusFor(fixture, 'January')).toEqual({ text: '1000 over', status: 'over' });
    expect(TestBed.inject(CategoryService).revision()).toBeGreaterThan(0);
  });

  it('updates to Complete after a cell blur without storing a total document', async () => {
    await testDb.store.insert(COLLECTIONS.settings, { startingYear: 2026 });
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 70_000);

    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const januaryBefore = fixture.nativeElement.querySelector(
      'span[aria-label="January allocation"]',
    ) as HTMLElement;
    expect(januaryBefore.textContent?.trim()).toBe('300 left');
    expect(januaryBefore.closest('li')?.getAttribute('data-status')).toBe('under');

    const savingsInput = fixture.nativeElement.querySelector(
      '#category-name-savings',
    ) as HTMLInputElement;
    savingsInput.value = 'Emergency';
    savingsInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('section[data-type="savings"] form')!
      .dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    const emergencyJanuary = fixture.nativeElement.querySelector(
      'input[aria-label="Emergency January"]',
    ) as HTMLInputElement;
    emergencyJanuary.value = '300';
    emergencyJanuary.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    emergencyJanuary.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();

    // Allow the strip's revision-driven reload to settle.
    await fixture.whenStable();
    fixture.detectChanges();

    const januaryAfter = fixture.nativeElement.querySelector(
      'span[aria-label="January allocation"]',
    ) as HTMLElement;
    expect(januaryAfter.textContent?.trim()).toBe('Complete');
    expect(januaryAfter.closest('li')?.getAttribute('data-status')).toBe('balanced');

    const cells = await testDb.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    expect(cells).toHaveLength(3);
    expect(TestBed.inject(BudgetCellService).revision()).toBeGreaterThan(0);
  });

  it('ignores a stale reload when revision advances mid-flight', async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    await insertCell(salary.id, 1, 100_000);

    let releaseFirst!: () => void;
    const firstListGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const originalList = testDb.store.list.bind(testDb.store);
    let budgetListCalls = 0;
    testDb.store.list = async <T extends object>(
      collection: Parameters<DocumentStore['list']>[0],
    ) => {
      const rows = await originalList<T>(collection);
      if (collection === COLLECTIONS.budgetCells) {
        budgetListCalls += 1;
        if (budgetListCalls === 1) {
          await firstListGate;
        }
      }
      return rows;
    };

    const fixture = TestBed.createComponent(PlanAllocationStatus);
    fixture.componentRef.setInput('year', 2026);
    fixture.detectChanges();
    await Promise.resolve();

    await TestBed.inject(BudgetCellService).save(rent.id, 2026, 1, 120_000);
    fixture.detectChanges();
    releaseFirst();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(statusFor(fixture, 'January')).toEqual({ text: '200 over', status: 'over' });
  });
});
