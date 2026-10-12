import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Category } from '../../../../data/domains/category/category';
import { COLLECTIONS } from '../../../../data/store/types';
import {
  holdFirstBudgetCellList,
  type DocumentStoreHarness,
} from '../../../../data/store/document-store/document-store.harness';
import { planHarness } from '../../plan.harness';
import { Plan } from '../../plan';
import { PlanAllocationStatus } from './plan-allocation-status';

/** Shared seed/render helpers for PlanAllocationStatus specs. Call after provideDocumentStoreHarness. */
export function planAllocationStatusHarness(storeHarness: DocumentStoreHarness) {
  const { seedStartingYear, renderPlan, submitInSection, setCell } = planHarness(storeHarness);

  /** Income 1000 + expense 700 + savings 300 → January balanced. */
  const seedBalancedJanuary = async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    const emergency = await insertCategory('savings', 'Emergency');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 70_000);
    await insertCell(emergency.id, 1, 30_000);
    return { salary, rent, emergency };
  };

  /** Income 1000 + expense 1200 → January over. */
  const seedOverAllocatedJanuary = async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 120_000);
    return { salary, rent };
  };

  /** Year set; income 1000 + expense 700 → January under by 300. */
  const seedUnderAllocatedJanuaryOnPlan = async () => {
    await seedStartingYear(2026);
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    await insertCell(salary.id, 1, 100_000);
    await insertCell(rent.id, 1, 70_000);
    return { salary, rent };
  };

  /** Income + expense categories; only salary January cell (for mid-flight races). */
  const seedSalaryJanuaryWithExpenseCategory = async () => {
    const salary = await insertCategory('income', 'Salary');
    const rent = await insertCategory('expense', 'Rent');
    await insertCell(salary.id, 1, 100_000);
    return { salary, rent };
  };

  const completeJanuaryWithSavingsBlur = async (fixture: ComponentFixture<Plan>) => {
    await submitInSection(fixture, 'savings', 'Emergency');
    await setCell(fixture, 'Emergency January', '300');
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const renderStrip = async () => {
    const fixture = TestBed.createComponent(PlanAllocationStatus);
    fixture.componentRef.setInput('year', 2026);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  /** Mount the strip and kick the effect without awaiting whenStable (held lists would hang). */
  const startStripLoadWithoutWaiting = async () => {
    const fixture = TestBed.createComponent(PlanAllocationStatus);
    fixture.componentRef.setInput('year', 2026);
    fixture.detectChanges();
    await Promise.resolve();
    return fixture;
  };

  const stripStatus = (fixture: ComponentFixture<PlanAllocationStatus>, monthLong: string) =>
    statusFor(fixture.nativeElement, monthLong);

  const planStatus = (fixture: ComponentFixture<Plan>, monthLong: string) =>
    statusFor(fixture.nativeElement, monthLong);

  const insertCategory = (
    type: Category['type'],
    name: string,
    extras: Partial<Pick<Category, 'active' | 'sortOrder'>> = {},
  ) =>
    storeHarness.store.insert(COLLECTIONS.categories, {
      type,
      name,
      sortOrder: extras.sortOrder ?? 0,
      active: extras.active ?? true,
    });

  const insertCell = (categoryId: string, month: number, amountCents: number) =>
    storeHarness.store.insert(COLLECTIONS.budgetCells, {
      categoryId,
      year: 2026,
      month,
      amountCents,
    });

  const statusFor = (host: HTMLElement, monthLong: string) => {
    const state = host.querySelector(
      `span[aria-label="${monthLong} allocation"]`,
    ) as HTMLElement | null;
    const listItem = state?.closest('li');
    return {
      text: state?.textContent?.trim() ?? '',
      status: listItem?.getAttribute('data-status') ?? '',
    };
  };

  return {
    seedBalancedJanuary,
    seedOverAllocatedJanuary,
    seedUnderAllocatedJanuaryOnPlan,
    seedSalaryJanuaryWithExpenseCategory,
    completeJanuaryWithSavingsBlur,
    renderStrip,
    startStripLoadWithoutWaiting,
    stripStatus,
    renderPlan,
    planStatus,
    holdFirstBudgetCellList: () => holdFirstBudgetCellList(storeHarness),
  };
}
