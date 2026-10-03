import { Component, effect, inject, input, PendingTasks, signal } from '@angular/core';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import { CategoryService } from '../../../../data/domains/category/category.service';
import {
  computePeriodBalance,
  type PeriodBalance,
  type PeriodBalanceStatus,
} from '../../../../data/lib/period-balance';
import { runPending } from '../../../shared/helpers/run-pending';
import { centsToDollarInput } from '../plan-amount-cell/helpers/cents-to-dollar-input';
import { PLAN_MONTH_LONG, PLAN_MONTH_SHORT, PLAN_MONTHS } from '../plan-amount-grid/constants';
import { periodTotalsByMonth } from './helpers/period-totals-by-month';

/** One month chip for the allocation status strip. */
export interface MonthAllocationView {
  month: number;
  shortLabel: string;
  longLabel: string;
  status: PeriodBalanceStatus;
  statusLabel: string;
}

/**
 * Compact Jan–Dec strip: remaining-to-allocate per month via shared computePeriodBalance.
 * Status rules live in the helper — this component only maps status → copy/CSS.
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
      const year = this.year();
      // Depend on both revisions: cell blur and category hide/unhide.
      const cellRevision = this.budgetCells.revision();
      const categoryRevision = this.categories.revision();
      this.months.set([]);
      this.error.set(null);
      void this.load(year, cellRevision, categoryRevision);
    });
  }

  private async load(year: number, cellRevision: number, categoryRevision: number): Promise<void> {
    const isCurrent = () =>
      this.year() === year &&
      this.budgetCells.revision() === cellRevision &&
      this.categories.revision() === categoryRevision;
    await runPending(
      this.pendingTasks,
      this.error,
      'Could not load allocation status. Refresh and try again.',
      async () => {
        const [income, expense, savings, cells] = await Promise.all([
          this.categories.listByType('income'),
          this.categories.listByType('expense'),
          this.categories.listByType('savings'),
          this.budgetCells.listForYear(year),
        ]);
        // Drop stale reloads: a newer revision (or year) won the race.
        if (!isCurrent()) {
          return;
        }
        const totals = periodTotalsByMonth(cells, [...income, ...expense, ...savings]);
        this.months.set(
          PLAN_MONTHS.map((month, index) =>
            toMonthView(month, computePeriodBalance(totals[index])),
          ),
        );
      },
      isCurrent,
    );
  }
}

function toMonthView(month: number, balance: PeriodBalance): MonthAllocationView {
  const shortLabel = PLAN_MONTH_SHORT[month - 1];
  const longLabel = PLAN_MONTH_LONG[month - 1];
  return {
    month,
    shortLabel,
    longLabel,
    status: balance.status,
    statusLabel: statusLabel(balance),
  };
}

/** Presentation only — never re-derive under/balanced/over from remaining here. */
function statusLabel(balance: PeriodBalance): string {
  switch (balance.status) {
    case 'untouched':
      return 'Not started';
    case 'under':
      return `${centsToDollarInput(balance.remainingCents)} left`;
    case 'balanced':
      return 'Complete';
    case 'over':
      return `${centsToDollarInput(Math.abs(balance.remainingCents))} over`;
  }
}
