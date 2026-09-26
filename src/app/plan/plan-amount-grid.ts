import { Component, effect, inject, input, PendingTasks, signal } from '@angular/core';
import { centsToDollarInput, dollarsToCents } from '../../data/budget-cell';
import { BudgetCellService } from '../../data/budget-cell.service';
import type { Category } from '../../data/category';
import type { StoreDocument } from '../../data/document';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Sticky/scrollable category × Jan–Dec amount grid for one plan year. */
@Component({
  selector: 'app-plan-amount-grid',
  styleUrl: './plan-amount-grid.css',
  templateUrl: './plan-amount-grid.html',
})
export class PlanAmountGrid {
  private readonly budgetCells = inject(BudgetCellService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly year = input.required<number>();
  readonly rows = input.required<StoreDocument<Category>[]>();

  protected readonly months = MONTHS;
  protected readonly monthShort = MONTH_SHORT;
  protected readonly monthLong = MONTH_LONG;

  protected readonly error = signal<string | null>(null);
  /** Draft display strings keyed by `categoryId:month`. */
  private readonly cellDrafts = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      this.year();
      void this.loadCells();
    });
  }

  protected draftFor(categoryId: string, month: number): string {
    return this.cellDrafts()[cellKey(categoryId, month)] ?? '';
  }

  protected onCellDraft(categoryId: string, month: number, event: Event): void {
    const { value } = event.target as HTMLInputElement;
    this.cellDrafts.update((drafts) => ({
      ...drafts,
      [cellKey(categoryId, month)]: value,
    }));
  }

  protected async saveCell(categoryId: string, month: number): Promise<void> {
    let amountCents: number | null;
    try {
      amountCents = dollarsToCents(this.draftFor(categoryId, month));
    } catch {
      this.error.set('Enter a non-negative dollar amount.');
      return;
    }

    const done = this.pendingTasks.add();
    try {
      this.error.set(null);
      await this.budgetCells.save(categoryId, this.year(), month, amountCents);
      this.cellDrafts.update((drafts) => {
        const next = { ...drafts };
        const key = cellKey(categoryId, month);
        if (amountCents === null) {
          delete next[key];
        } else {
          next[key] = centsToDollarInput(amountCents);
        }
        return next;
      });
    } catch {
      this.error.set('Could not save the amount. Try again.');
    } finally {
      done();
    }
  }

  private async loadCells(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      const cells = await this.budgetCells.listForYear(this.year());
      const drafts: Record<string, string> = {};
      for (const cell of cells) {
        drafts[cellKey(cell.categoryId, cell.month)] = centsToDollarInput(cell.amountCents);
      }
      this.cellDrafts.set(drafts);
      this.error.set(null);
    } catch {
      this.error.set('Could not load amounts. Refresh and try again.');
    } finally {
      done();
    }
  }
}

function cellKey(categoryId: string, month: number): string {
  return `${categoryId}:${month}`;
}
