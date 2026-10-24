import { Component, effect, inject, input, output, PendingTasks, signal } from '@angular/core';
import { formatCentsAsDollarInput } from '../../format-cents-as-dollar-input';
import { PLAN_MONTH_LONG, PLAN_MONTH_SHORT, PLAN_MONTHS } from '../../plan-months';
import { buildAmountsFromCells } from './helpers/build-amounts-from-cells';
import { buildAmountsWithCommittedCell } from './helpers/build-amounts-with-committed-cell';
import { buildCellKey } from './helpers/build-cell-key';
import { sumSectionMonthTotalCents } from './helpers/sum-section-month-total-cents';
import { sumSectionYearTotalCents } from './helpers/sum-section-year-total-cents';
import { sumYearTotalCents } from './helpers/sum-year-total-cents';
import { BudgetCellService } from '../../../../../data/domains/budget-cell/budget-cell.service';
import type { Category } from '../../../../../data/domains/category/category';
import type { StoreDocument } from '../../../../../data/store/types';
import { attemptWhilePending } from '../../../../shared/helpers/attempt-while-pending';
import { PlanAmountCell } from '../plan-amount-cell/plan-amount-cell';
import { PlanCategoryNameInput } from '../plan-category-name-input/plan-category-name-input';

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
  readonly categories = input.required<StoreDocument<Category>[]>();
  /** Parent owns rename persist; name input only drafts and notifies on blur. */
  readonly nameChange = output<{ id: string; name: string }>();
  /** Parent owns hide persist; grid only notifies. */
  readonly hide = output<{ id: string }>();

  protected readonly months = PLAN_MONTHS;
  protected readonly monthShort = PLAN_MONTH_SHORT;
  protected readonly monthLong = PLAN_MONTH_LONG;

  protected readonly error = signal<string | null>(null);
  private readonly amounts = signal<Record<string, number>>({});

  constructor() {
    effect(() => {
      const year = this.year();

      this.clearStaleYearUi();
      void this.loadCells(year);
    });
  }

  /** Clear before reload so cells never show the previous year's values. */
  private clearStaleYearUi(): void {
    this.amounts.set({});
    this.error.set(null);
  }

  private async loadCells(year: number): Promise<void> {
    await attemptWhilePending(
      () => this.loadAmountsForYear(year),
      this.pendingTasks,
      () => {
        if (this.year() === year) {
          this.error.set('Could not load amounts. Refresh and try again.');
        }
      },
    );
  }

  private async loadAmountsForYear(year: number): Promise<void> {
    this.error.set(null);

    const cells = await this.budgetCells.listForYear(year);

    if (this.year() !== year) {
      return;
    }

    this.amounts.set(buildAmountsFromCells(cells));
  }

  protected getAmountCentsFor(categoryId: string, month: number): number | null {
    return this.amounts()[buildCellKey(categoryId, month)] ?? null;
  }

  protected formatYearTotalFor(categoryId: string): string {
    return formatCentsAsDollarInput(sumYearTotalCents(this.amounts(), categoryId));
  }

  protected formatSectionTotalFor(month: number): string {
    return formatCentsAsDollarInput(
      sumSectionMonthTotalCents(this.amounts(), this.categories(), month),
    );
  }

  protected formatSectionYearTotal(): string {
    return formatCentsAsDollarInput(sumSectionYearTotalCents(this.amounts(), this.categories()));
  }

  protected onCellError(message: string): void {
    this.error.set(message);
  }

  protected onCommitted(categoryId: string, month: number, amountCents: number | null): void {
    this.error.set(null);

    this.amounts.update((amounts) =>
      buildAmountsWithCommittedCell(amounts, { categoryId, month, amountCents }),
    );
  }
}
