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

    const categoryName = this.parseCategoryName(this.nameInput());

    if (!categoryName) {
      return;
    }

    await this.attemptMutation(() => this.addCategory(categoryName));
  }

  private async addCategory(categoryName: string): Promise<void> {
    await this.categoryService.add(this.type(), categoryName);

    this.nameInput.set('');
  }

  protected async rename(categoryId: string, typedName: string): Promise<void> {
    const categoryName = this.parseNameForRename(categoryId, typedName);

    if (!categoryName) {
      return;
    }

    await this.attemptMutation(() => this.renameCategory(categoryId, categoryName));
  }

  private parseNameForRename(categoryId: string, typedName: string): string | undefined {
    const categoryName = this.parseCategoryName(typedName);

    if (!categoryName || this.isNameUnchanged(categoryId, categoryName)) {
      return undefined;
    }

    return categoryName;
  }

  private parseCategoryName(typedName: string): string | undefined {
    const categoryName = parseCategoryName(typedName);

    if (!categoryName) {
      this.error.set('Enter a category name.');

      return undefined;
    }

    return categoryName;
  }

  private isNameUnchanged(categoryId: string, categoryName: string): boolean {
    return this.activeCategories().some(
      (category) => category.id === categoryId && category.name === categoryName,
    );
  }

  private async renameCategory(id: string, name: string): Promise<void> {
    await this.categoryService.rename(id, name);
  }

  protected async hide(categoryId: string): Promise<void> {
    await this.attemptMutation(() => this.hideCategory(categoryId));
  }

  private async hideCategory(categoryId: string): Promise<void> {
    await this.categoryService.hide(categoryId);
  }

  protected async unhide(categoryId: string): Promise<void> {
    await this.attemptMutation(() => this.unhideCategory(categoryId));
  }

  private async unhideCategory(categoryId: string): Promise<void> {
    await this.categoryService.unhide(categoryId);
  }

  private async attemptMutation(mutation: () => Promise<void>): Promise<void> {
    await attemptWhilePending(
      () => this.runThenRefresh(mutation),
      this.pendingTasks,
      () => this.error.set('Could not save the category. Try again.'),
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
