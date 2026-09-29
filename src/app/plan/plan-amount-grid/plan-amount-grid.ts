import { Component, effect, inject, input, output, PendingTasks, signal } from '@angular/core';
import {
  amountsFromCells,
  cellKey,
  PLAN_MONTH_LONG,
  PLAN_MONTH_SHORT,
  PLAN_MONTHS,
} from './helpers';
import { centsToDollarInput } from './plan-amount-cell/helpers';
import { sectionMonthTotalCents } from './section-month-total-cents';
import { sectionYearTotalCents } from './section-year-total-cents';
import { yearTotalCents } from './year-total-cents';
import { BudgetCellService } from '../../../data/domains/budget-cell/budget-cell.service';
import type { Category } from '../../../data/domains/category/category';
import type { StoreDocument } from '../../../data/store/types';
import { runPending } from '../../shared/with-pending-task';
import { PlanAmountCell } from './plan-amount-cell/plan-amount-cell';
import { PlanCategoryNameInput } from '../plan-category-name-input/plan-category-name-input';

/** Sticky/scrollable category × Jan–Dec amount grid for one plan year. */
@Component({
  selector: 'app-plan-amount-grid',
  imports: [PlanAmountCell, PlanCategoryNameInput],
  styleUrl: './plan-amount-grid.css',
  templateUrl: './plan-amount-grid.html',
})
export class PlanAmountGrid {
  private readonly budgetCells = inject(BudgetCellService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly year = input.required<number>();
  readonly rows = input.required<StoreDocument<Category>[]>();
  /** Parent owns rename persist; name input only drafts and notifies on blur. */
  readonly nameChange = output<{ id: string; name: string }>();

  protected readonly months = PLAN_MONTHS;
  protected readonly monthShort = PLAN_MONTH_SHORT;
  protected readonly monthLong = PLAN_MONTH_LONG;

  protected readonly error = signal<string | null>(null);
  /** Loaded amount cents keyed by `categoryId:month`. */
  private readonly amounts = signal<Record<string, number>>({});

  constructor() {
    effect(() => {
      const year = this.year();
      // Clear immediately so cells do not keep showing the previous year's values.
      this.amounts.set({});
      this.error.set(null);
      void this.loadCells(year);
    });
  }

  protected amountFor(categoryId: string, month: number): number | null {
    return this.amounts()[cellKey(categoryId, month)] ?? null;
  }

  protected yearTotalFor(categoryId: string): string {
    return centsToDollarInput(yearTotalCents(this.amounts(), categoryId));
  }

  protected sectionTotalFor(month: number): string {
    return centsToDollarInput(sectionMonthTotalCents(this.amounts(), this.rows(), month));
  }

  protected sectionYearTotal(): string {
    return centsToDollarInput(sectionYearTotalCents(this.amounts(), this.rows()));
  }

  protected onCellError(message: string): void {
    this.error.set(message);
  }

  protected onCommitted(categoryId: string, month: number, amountCents: number | null): void {
    this.error.set(null);
    this.amounts.update((amounts) => {
      const next = { ...amounts };
      const key = cellKey(categoryId, month);
      if (amountCents === null) {
        delete next[key];
      } else {
        next[key] = amountCents;
      }
      return next;
    });
  }

  private async loadCells(year: number): Promise<void> {
    await runPending(
      this.pendingTasks,
      this.error,
      'Could not load amounts. Refresh and try again.',
      async () => {
        const cells = await this.budgetCells.listForYear(year);
        if (this.year() !== year) {
          return;
        }
        this.amounts.set(amountsFromCells(cells));
      },
      () => this.year() === year,
    );
  }
}
