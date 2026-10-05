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

const SECTION_TITLES: Record<CategoryType, string> = {
  income: 'Income',
  expense: 'Expenses',
  savings: 'Savings',
};

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

  protected readonly nameDraft = signal('');
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

  protected onNameDraft(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  protected async add(event: Event): Promise<void> {
    event.preventDefault();

    const categoryName = parseCategoryName(this.nameDraft());

    if (!categoryName) {
      this.error.set('Enter a category name.');

      return;
    }

    await attemptWhilePending(
      () => this.runThenRefresh(() => this.addCategory(categoryName)),
      this.pendingTasks,
      () => this.error.set('Could not save the category. Try again.'),
    );
  }

  private async addCategory(categoryName: string): Promise<void> {
    await this.categoryService.add(this.type(), categoryName);

    this.nameDraft.set('');
  }

  protected async rename(categoryId: string, raw: string): Promise<void> {
    const categoryName = parseCategoryName(raw);

    if (!categoryName) {
      this.error.set('Enter a category name.');

      return;
    }

    if (
      this.activeCategories().some(
        (category) => category.id === categoryId && category.name === categoryName,
      )
    ) {
      return;
    }

    await attemptWhilePending(
      () => this.runThenRefresh(() => this.renameCategory(categoryId, categoryName)),
      this.pendingTasks,
      () => this.error.set('Could not save the category. Try again.'),
    );
  }

  private async renameCategory(id: string, name: string): Promise<void> {
    await this.categoryService.rename(id, name);
  }

  protected async hide(categoryId: string): Promise<void> {
    await attemptWhilePending(
      () => this.runThenRefresh(() => this.hideCategory(categoryId)),
      this.pendingTasks,
      () => this.error.set('Could not save the category. Try again.'),
    );
  }

  private async hideCategory(categoryId: string): Promise<void> {
    await this.categoryService.hide(categoryId);
  }

  protected async unhide(categoryId: string): Promise<void> {
    await attemptWhilePending(
      () => this.runThenRefresh(() => this.unhideCategory(categoryId)),
      this.pendingTasks,
      () => this.error.set('Could not save the category. Try again.'),
    );
  }

  private async unhideCategory(categoryId: string): Promise<void> {
    await this.categoryService.unhide(categoryId);
  }

  private async load(): Promise<void> {
    await attemptWhilePending(
      () => this.runThenRefresh(),
      this.pendingTasks,
      () => this.error.set('Could not load categories. Refresh and try again.'),
    );
  }

  private async runThenRefresh(work: () => Promise<void> = () => Promise.resolve()): Promise<void> {
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
