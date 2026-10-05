import { Component, effect, inject, input, PendingTasks, signal } from '@angular/core';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import { CategoryService } from '../../../../data/domains/category/category.service';
import { computePeriodBalance } from '../../../../data/lib/period-balance';
import { attemptWhilePending } from '../../../shared/helpers/attempt-while-pending';
import { PLAN_MONTHS } from '../plan-amount-grid/constants';
import { periodTotalsByMonth } from './helpers/period-totals-by-month';
import { type MonthAllocationView, toMonthView } from './helpers/to-month-view';

/** Year + revisions captured when one allocation-status load starts. */
interface AllocationStatusLoad {
  year: number;
  cellRevision: number;
  categoryRevision: number;
}

/**
 * Compact Jan–Dec strip: remaining-to-allocate per month via shared computePeriodBalance.
 * Status rules and status → copy mapping live in helpers; this component loads and renders.
 */
@Component({
  selector: 'app-plan-allocation-status',
  styleUrl: './plan-allocation-status.css',
  templateUrl: './plan-allocation-status.html',
})
export class PlanAllocationStatus {
  private readonly budgetCells = inject(BudgetCellService);
  private readonly categories = inject(CategoryService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly year = input.required<number>();

  protected readonly error = signal<string | null>(null);
  protected readonly months = signal<MonthAllocationView[]>([]);

  constructor() {
    effect(() => {
      // Depend on both revisions: cell blur and category hide/unhide.
      const statusLoad: AllocationStatusLoad = {
        year: this.year(),
        cellRevision: this.budgetCells.revision(),
        categoryRevision: this.categories.revision(),
      };

      this.months.set([]);
      this.error.set(null);

      void this.load(statusLoad);
    });
  }

  private async load(statusLoad: AllocationStatusLoad): Promise<void> {
    await attemptWhilePending(
      () => this.loadMonthsForYear(statusLoad),
      this.pendingTasks,
      () => {
        if (this.isLoadCurrent(statusLoad)) {
          this.error.set('Could not load allocation status. Refresh and try again.');
        }
      },
    );
  }

  private async loadMonthsForYear(statusLoad: AllocationStatusLoad): Promise<void> {
    const [income, expense, savings, cells] = await Promise.all([
      this.categories.listByType('income'),
      this.categories.listByType('expense'),
      this.categories.listByType('savings'),
      this.budgetCells.listForYear(statusLoad.year),
    ]);

    if (!this.isLoadCurrent(statusLoad)) {
      return;
    }

    const totals = periodTotalsByMonth(cells, [...income, ...expense, ...savings]);

    this.months.set(
      PLAN_MONTHS.map((month, index) => toMonthView(month, computePeriodBalance(totals[index]))),
    );
  }

  private isLoadCurrent(statusLoad: AllocationStatusLoad): boolean {
    return (
      this.year() === statusLoad.year &&
      this.budgetCells.revision() === statusLoad.cellRevision &&
      this.categories.revision() === statusLoad.categoryRevision
    );
  }
}
