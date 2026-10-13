import { Component, effect, inject, input, PendingTasks, signal } from '@angular/core';
import {
  parseCategoryName,
  type Category,
  type CategoryType,
} from '../../../../data/domains/category/category';
import { CategoryService } from '../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../data/store/types';
import { attemptWhilePending } from '../../../shared/helpers/attempt-while-pending';
import { PlanAmountGrid } from '../plan-amount-grid/plan-amount-grid';
import { PlanCategoryNameInput } from '../plan-category-name-input/plan-category-name-input';
import { SECTION_TITLES } from './constants';
import { categoryNameForRename } from './helpers/category-name-for-rename';

@Component({
  selector: 'app-plan-category-section',
  imports: [PlanAmountGrid, PlanCategoryNameInput],
  styleUrl: './plan-category-section.css',
  templateUrl: './plan-category-section.html',
})
export class PlanCategorySection {
  private readonly categoryService = inject(CategoryService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly type = input.required<CategoryType>();
  /** Null hides amount columns (empty state owned elsewhere). */
  readonly year = input<number | null>(null);

  protected readonly nameInput = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly activeCategories = signal<StoreDocument<Category>[]>([]);
  protected readonly hiddenCategories = signal<StoreDocument<Category>[]>([]);

  protected get title(): string {
    return SECTION_TITLES[this.type()];
  }

  constructor() {
    effect(() => {
      this.type();

      void this.load();
    });
  }

  private async load(): Promise<void> {
    await attemptWhilePending(
      () => this.runThenRefresh(),
      this.pendingTasks,
      () => this.error.set('Could not load categories. Refresh and try again.'),
    );
  }

  protected onNameInput(event: Event): void {
    this.nameInput.set((event.target as HTMLInputElement).value);
  }

  protected async add(event: Event): Promise<void> {
    event.preventDefault();

    const categoryName = parseCategoryName(this.nameInput());

    if (!categoryName) {
      this.error.set('Enter a category name.');

      return;
    }

    await this.attemptMutation(async () => {
      await this.categoryService.add(this.type(), categoryName);
      this.nameInput.set('');
    });
  }

  protected async rename(categoryId: string, typedName: string): Promise<void> {
    const outcome = categoryNameForRename(categoryId, typedName, this.activeCategories());

    if (outcome.status === 'empty-or-invalid') {
      this.error.set('Enter a category name.');

      return;
    }

    if (outcome.status === 'unchanged') {
      return;
    }

    await this.attemptMutation(() => this.categoryService.rename(categoryId, outcome.categoryName));
  }

  protected async hide(categoryId: string): Promise<void> {
    await this.attemptMutation(() => this.categoryService.hide(categoryId));
  }

  protected async unhide(categoryId: string): Promise<void> {
    await this.attemptMutation(() => this.categoryService.unhide(categoryId));
  }

  private async attemptMutation(mutation: () => Promise<unknown>): Promise<void> {
    await attemptWhilePending(
      () => this.runThenRefresh(mutation),
      this.pendingTasks,
      () => this.error.set('Could not save the category. Try again.'),
    );
  }

  private async runThenRefresh(
    work: () => Promise<unknown> = () => Promise.resolve(),
  ): Promise<void> {
    this.error.set(null);

    await work();

    await this.refresh();
  }

  private async refresh(): Promise<void> {
    const type = this.type();

    const [active, hidden] = await Promise.all([
      this.categoryService.listByType(type),
      this.categoryService.listHiddenByType(type),
    ]);

    this.activeCategories.set(active);
    this.hiddenCategories.set(hidden);
  }
}
