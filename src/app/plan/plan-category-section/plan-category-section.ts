import { Component, effect, inject, input, PendingTasks, signal } from '@angular/core';
import {
  parseCategoryName,
  type Category,
  type CategoryType,
} from '../../../data/domains/category/category';
import { CategoryService } from '../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../data/store/types';
import { runPending } from '../../shared/with-pending-task';
import { PlanAmountGrid } from '../plan-amount-grid/plan-amount-grid';
import { PlanCategoryNameInput } from '../plan-category-name-input/plan-category-name-input';

const SECTION_TITLES: Record<CategoryType, string> = {
  income: 'Income',
  expense: 'Expenses',
  savings: 'Savings',
};

/**
 * Add, list, and rename categories for one Plan section type.
 * When `year` is set, mounts the amount grid for that year.
 */
@Component({
  selector: 'app-plan-category-section',
  imports: [PlanAmountGrid, PlanCategoryNameInput],
  styleUrl: './plan-category-section.css',
  templateUrl: './plan-category-section.html',
})
export class PlanCategorySection {
  private readonly categories = inject(CategoryService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly type = input.required<CategoryType>();
  /** Plan year from Settings; null hides the amount columns (PB-49 owns empty state). */
  readonly year = input<number | null>(null);

  protected readonly nameDraft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly rows = signal<StoreDocument<Category>[]>([]);

  protected get title(): string {
    return SECTION_TITLES[this.type()];
  }

  constructor() {
    effect(() => {
      this.type();
      void this.load();
    });
  }

  protected onNameDraft(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  protected async add(event: Event): Promise<void> {
    event.preventDefault();
    const name = parseCategoryName(this.nameDraft());
    if (!name) {
      this.error.set('Enter a category name.');
      return;
    }

    await runPending(
      this.pendingTasks,
      this.error,
      'Could not save the category. Try again.',
      async () => {
        await this.categories.add(this.type(), name);
        this.nameDraft.set('');
        await this.refresh();
      },
    );
  }

  protected async rename(id: string, raw: string): Promise<void> {
    const name = parseCategoryName(raw);
    if (!name) {
      this.error.set('Enter a category name.');
      return;
    }
    if (this.rows().some((row) => row.id === id && row.name === name)) {
      return;
    }

    await runPending(
      this.pendingTasks,
      this.error,
      'Could not save the category. Try again.',
      async () => {
        await this.categories.rename(id, name);
        await this.refresh();
      },
    );
  }

  private async load(): Promise<void> {
    await runPending(
      this.pendingTasks,
      this.error,
      'Could not load categories. Refresh and try again.',
      () => this.refresh(),
    );
  }

  private async refresh(): Promise<void> {
    this.rows.set(await this.categories.listByType(this.type()));
  }
}
