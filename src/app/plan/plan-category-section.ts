import { Component, inject, input, OnInit, PendingTasks, signal } from '@angular/core';
import type { Category, CategoryType } from '../../data/category';
import { CategoryService } from '../../data/category.service';
import type { StoreDocument } from '../../data/document';

const SECTION_TITLES: Record<CategoryType, string> = {
  income: 'Income',
  expense: 'Expenses',
  savings: 'Savings',
};

/** Add and list categories for one Plan section type (income / expense / savings). */
@Component({
  selector: 'app-plan-category-section',
  styleUrl: './plan-category-section.css',
  templateUrl: './plan-category-section.html',
})
export class PlanCategorySection implements OnInit {
  private readonly categories = inject(CategoryService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly type = input.required<CategoryType>();

  protected readonly nameDraft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly rows = signal<StoreDocument<Category>[]>([]);

  protected get title(): string {
    return SECTION_TITLES[this.type()];
  }

  ngOnInit(): void {
    void this.load();
  }

  protected onNameDraft(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  protected async add(event: Event): Promise<void> {
    event.preventDefault();
    const done = this.pendingTasks.add();
    try {
      this.error.set(null);
      await this.categories.add(this.type(), this.nameDraft());
      this.nameDraft.set('');
      await this.refresh();
    } catch {
      this.error.set('Enter a category name.');
    } finally {
      done();
    }
  }

  private async load(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      await this.refresh();
    } catch {
      this.error.set('Could not load categories. Refresh and try again.');
    } finally {
      done();
    }
  }

  private async refresh(): Promise<void> {
    this.rows.set(await this.categories.listByType(this.type()));
  }
}
