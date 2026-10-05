import { Component, effect, inject, input, output, PendingTasks, signal } from '@angular/core';
import { centsToDollarInput } from './helpers/cents-to-dollar-input';
import { dollarsToCents } from './helpers/dollars-to-cents';
import { BudgetCellService } from '../../../../data/domains/budget-cell/budget-cell.service';
import { attemptWhilePending } from '../../../shared/helpers/attempt-while-pending';

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
      const amountCents = this.amountCents();

      this.draft.set(amountCents === null ? '' : centsToDollarInput(amountCents));
    });
  }

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    const year = this.year();
    const amountCents = this.parseDraftOrFail();

    if (amountCents === undefined) {
      return;
    }

    if (amountCents === this.amountCents()) {
      this.resetDraft(amountCents);

      return;
    }

    await this.persistAmount(year, amountCents);
  }

  private parseDraftOrFail(): number | null | undefined {
    try {
      return dollarsToCents(this.draft());
    } catch {
      this.saveError.emit('Enter a non-negative dollar amount.');

      return undefined;
    }
  }

  private resetDraft(amountCents: number | null): void {
    this.draft.set(amountCents === null ? '' : centsToDollarInput(amountCents));
  }

  private async persistAmount(year: number, amountCents: number | null): Promise<void> {
    await attemptWhilePending(
      () => this.commitAmount(year, amountCents),
      this.pendingTasks,
      () => {
        if (this.year() === year) {
          this.saveError.emit('Could not save the amount. Try again.');
        }
      },
    );
  }

  private async commitAmount(year: number, amountCents: number | null): Promise<void> {
    await this.budgetCells.save({
      categoryId: this.categoryId(),
      year,
      month: this.month(),
      amountCents,
    });

    if (this.year() !== year) {
      return;
    }

    this.resetDraft(amountCents);
    this.committed.emit(amountCents);
  }
}
