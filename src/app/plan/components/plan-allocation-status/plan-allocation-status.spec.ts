import { TestBed } from '@angular/core/testing';
import type { BudgetCell } from '../../../../data/domains/budget-cell/budget-cell';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import { CategoryService } from '../../../../data/domains/category/category.service';
import { COLLECTIONS } from '../../../../data/store/types';
import {
  deferFirstStoreBudgetCellList,
  provideDocumentStoreHarness,
} from '../../../../data/store/document-store/document-store.harness';
import { Plan } from '../../plan';
import { PlanAllocationStatus } from './plan-allocation-status';
import { planAllocationStatusHarness } from './plan-allocation-status.harness';

describe('PlanAllocationStatus', () => {
  const storeHarness = provideDocumentStoreHarness('pb-22-allocation-status', {
    imports: [PlanAllocationStatus, Plan],
  });
  const {
    seedBalancedJanuary,
    seedOverAllocatedJanuary,
    seedUnderAllocatedJanuaryOnPlan,
    seedSalaryJanuaryWithExpenseCategory,
    completeJanuaryWithSavingsBlur,
    startStripLoadWithoutWaiting,
    renderStrip,
    stripStatus,
    renderPlan,
    planStatus,
  } = planAllocationStatusHarness(storeHarness);

  it('shows Complete for a zero-remaining January with real inputs', async () => {
    await seedBalancedJanuary();

    const fixture = await renderStrip();

    expect(stripStatus(fixture, 'January')).toEqual({ text: 'Complete', status: 'balanced' });
  });

  it('leaves other months untouched when only January is balanced', async () => {
    await seedBalancedJanuary();

    const fixture = await renderStrip();

    expect(stripStatus(fixture, 'February')).toEqual({ text: 'Not started', status: 'untouched' });
  });

  it('shows a warning state when a month is over-allocated', async () => {
    await seedOverAllocatedJanuary();

    const fixture = await renderStrip();

    expect(stripStatus(fixture, 'January')).toEqual({ text: '200 over', status: 'over' });
  });

  it('reloads when a category is hidden so its amounts leave the strip', async () => {
    const { salary } = await seedBalancedJanuary();
    const fixture = await renderStrip();

    await TestBed.inject(CategoryService).hide(salary.id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(stripStatus(fixture, 'January')).toEqual({ text: '1000 over', status: 'over' });
    expect(TestBed.inject(CategoryService).revision()).toBeGreaterThan(0);
  });

  it('shows under-allocated January on Plan before the balancing cell blur', async () => {
    await seedUnderAllocatedJanuaryOnPlan();

    const fixture = await renderPlan();

    expect(planStatus(fixture, 'January')).toEqual({ text: '300 left', status: 'under' });
  });

  it('updates to Complete after a savings cell blur on Plan', async () => {
    await seedUnderAllocatedJanuaryOnPlan();
    const fixture = await renderPlan();

    await completeJanuaryWithSavingsBlur(fixture);

    expect(planStatus(fixture, 'January')).toEqual({ text: 'Complete', status: 'balanced' });
    expect(TestBed.inject(BudgetCellService).revision()).toBeGreaterThan(0);
  });

  it('persists the balancing cell without a total document', async () => {
    await seedUnderAllocatedJanuaryOnPlan();
    const fixture = await renderPlan();

    await completeJanuaryWithSavingsBlur(fixture);
    const cells = await storeHarness.store.list<BudgetCell>(COLLECTIONS.budgetCells);

    expect(cells).toHaveLength(3);
  });

  it('ignores a stale reload when revision advances mid-flight', async () => {
    const { rent } = await seedSalaryJanuaryWithExpenseCategory();
    const { whenFirstListArrives, armNextListWatch, whenNextListCompletes, releaseFirstList } =
      deferFirstStoreBudgetCellList(storeHarness);
    const fixture = await startStripLoadWithoutWaiting();

    await whenFirstListArrives;
    armNextListWatch();
    await TestBed.inject(BudgetCellService).save({
      categoryId: rent.id,
      year: 2026,
      month: 1,
      amountCents: 120_000,
    });
    fixture.detectChanges();
    await whenNextListCompletes;
    releaseFirstList();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(stripStatus(fixture, 'January')).toEqual({ text: '200 over', status: 'over' });
  });
});
