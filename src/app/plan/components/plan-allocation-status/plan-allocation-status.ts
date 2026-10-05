import { Component, effect, inject, input, PendingTasks, signal } from '@angular/core';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import { CategoryService } from '../../../../data/domains/category/category.service';
import { computePeriodBalance } from '../../../../data/lib/period-balance';
import { attemptWhilePending } from '../../../shared/helpers/attempt-while-pending';
import { PLAN_MONTHS } from '../plan-amount-grid/constants';
import { periodTotalsByMonth } from './helpers/period-totals-by-month';
import { type MonthAllocationView, toMonthView } from './helpers/to-month-view';

interface AllocationStatusSnapshot {
  year: number;
  cellRevision: number;
  categoryRevision: number;
}

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
      const statusSnapshot = this.captureStatusSnapshot();

      this.months.set([]);
      this.error.set(null);

      void this.load(statusSnapshot);
    });
  }

  private captureStatusSnapshot(): AllocationStatusSnapshot {
    return {
      year: this.year(),
      cellRevision: this.budgetCells.revision(),
      categoryRevision: this.categories.revision(),
    };
  }

  private async load(statusSnapshot: AllocationStatusSnapshot): Promise<void> {
    await attemptWhilePending(
      () => this.loadMonthsForYear(statusSnapshot),
      this.pendingTasks,
      () => {
        if (this.isSnapshotCurrent(statusSnapshot)) {
          this.error.set('Could not load allocation status. Refresh and try again.');
        }
      },
    );
  }

  private async loadMonthsForYear(statusSnapshot: AllocationStatusSnapshot): Promise<void> {
    const [income, expense, savings, cells] = await Promise.all([
      this.categories.listByType('income'),
      this.categories.listByType('expense'),
      this.categories.listByType('savings'),
      this.budgetCells.listForYear(statusSnapshot.year),
    ]);

    if (!this.isSnapshotCurrent(statusSnapshot)) {
      return;
    }

    const totals = periodTotalsByMonth(cells, [...income, ...expense, ...savings]);

    this.months.set(
      PLAN_MONTHS.map((month, index) => toMonthView(month, computePeriodBalance(totals[index]))),
    );
  }

  private isSnapshotCurrent(statusSnapshot: AllocationStatusSnapshot): boolean {
    return (
      this.year() === statusSnapshot.year &&
      this.budgetCells.revision() === statusSnapshot.cellRevision &&
      this.categories.revision() === statusSnapshot.categoryRevision
    );
  }
}
