import { Component, effect, inject, input, output, PendingTasks, signal } from '@angular/core';
import { centsToDollarInput, dollarsToCents } from './helpers';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import { withPendingTask } from '../../../shared/with-pending-task';

/** One Plan amount cell: local draft, persist on blur. */
@Component({
  selector: 'app-plan-amount-cell',
  styleUrl: './plan-amount-cell.css',
  templateUrl: './plan-amount-cell.html',
})
export class PlanAmountCell {
  private readonly budgetCells = inject(BudgetCellService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly categoryId = input.required<string>();
  readonly month = input.required<number>();
  readonly year = input.required<number>();
  readonly label = input.required<string>();
  /** Stored cents; `null` means no sparse cell. */
  readonly amountCents = input<number | null>(null);
  readonly saveError = output<string>();
  /** Fired after a successful persist so the grid can refresh its amounts map. */
  readonly committed = output<number | null>();

  protected readonly draft = signal('');

  constructor() {
    effect(() => {
      const cents = this.amountCents();
      this.draft.set(cents === null ? '' : centsToDollarInput(cents));
    });
  }

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    const year = this.year();
    let amountCents: number | null;
    try {
      amountCents = dollarsToCents(this.draft());
    } catch {
      this.saveError.emit('Enter a non-negative dollar amount.');
      return;
    }

    if (amountCents === this.amountCents()) {
      this.draft.set(amountCents === null ? '' : centsToDollarInput(amountCents));
      return;
    }

    try {
      await withPendingTask(this.pendingTasks, async () => {
        await this.budgetCells.save(this.categoryId(), year, this.month(), amountCents);
        if (this.year() !== year) {
          return;
        }
        this.draft.set(amountCents === null ? '' : centsToDollarInput(amountCents));
        this.committed.emit(amountCents);
      });
    } catch {
      if (this.year() === year) {
        this.saveError.emit('Could not save the amount. Try again.');
      }
    }
  }
}
