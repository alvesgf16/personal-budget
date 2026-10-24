import { Component, computed, effect, inject, input, PendingTasks, signal } from '@angular/core';
import {
  parseCategoryName,
  type Category,
  type CategoryType,
} from '../../../../../data/domains/category/category';
import { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';
import { inputValueFromEvent } from '../../../../shared/helpers/input-value-from-event';
import { PlanAmountGrid } from '../plan-amount-grid/plan-amount-grid';
import { PlanCategoryNameInput } from '../plan-category-name-input/plan-category-name-input';
import { SECTION_TITLES } from './constants';
import { createCategorySectionLists } from './helpers/category-section-lists';
import { decideCategoryRename } from './helpers/decide-category-rename';

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

  protected readonly title = computed(() => SECTION_TITLES[this.type()]);
  protected readonly nameInput = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly activeCategories = signal<StoreDocument<Category>[]>([]);
  protected readonly hiddenCategories = signal<StoreDocument<Category>[]>([]);

  private readonly categoryLists = createCategorySectionLists({
    categoryService: this.categoryService,
    pendingTasks: this.pendingTasks,
    type: () => this.type(),
    error: this.error,
    activeCategories: this.activeCategories,
    hiddenCategories: this.hiddenCategories,
  });

  constructor() {
    effect(() => {
      this.type();
      void this.categoryLists.load();
    });
  }

  protected onNameInput(event: Event): void {
    this.nameInput.set(inputValueFromEvent(event));
  }

  protected async add(event: Event): Promise<void> {
    event.preventDefault();

    const categoryName = parseCategoryName(this.nameInput());

    if (!categoryName) {
      this.error.set('Enter a category name.');

      return;
    }

    await this.categoryLists.attemptMutation(async () => {
      await this.categoryService.add(this.type(), categoryName);
      this.nameInput.set('');
    });
  }

  protected async rename(categoryId: string, typedName: string): Promise<void> {
    const outcome = decideCategoryRename(categoryId, typedName, this.activeCategories());

    if (outcome.status === 'empty-or-invalid') {
      this.error.set('Enter a category name.');

      return;
    }

    if (outcome.status === 'unchanged') {
      return;
    }

    await this.categoryLists.attemptMutation(async () => {
      await this.categoryService.rename(categoryId, outcome.categoryName);
    });
  }

  protected async hide(categoryId: string): Promise<void> {
    await this.categoryLists.attemptMutation(async () => {
      await this.categoryService.hide(categoryId);
    });
  }

  protected async unhide(categoryId: string): Promise<void> {
    await this.categoryLists.attemptMutation(async () => {
      await this.categoryService.unhide(categoryId);
    });
  }
}
