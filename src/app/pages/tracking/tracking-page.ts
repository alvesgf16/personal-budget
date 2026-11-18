import { Component, inject, PendingTasks, signal, type WritableSignal } from '@angular/core';
import type { Category } from '../../../data/domains/category/category';
import { CategoryService } from '../../../data/domains/category/category.service';
import type { CategoryType } from '../../../data/lib/schemas/category-type';
import type { StoreDocument } from '../../../data/store/types';
import { inputValueFromEvent } from '../../shared/helpers/input-value-from-event';
import { runWhilePending } from '../../shared/helpers/run-while-pending';

const CATEGORY_TYPES: readonly CategoryType[] = ['income', 'expense', 'savings'];

@Component({
  selector: 'app-tracking',
  styleUrl: './tracking-page.css',
  templateUrl: './tracking-page.html',
})
export class TrackingPage {
  private readonly categoryService = inject(CategoryService);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly categoryTypes = CATEGORY_TYPES;
  protected readonly type = signal<CategoryType | ''>('');
  protected readonly categoryId = signal('');
  protected readonly amountInput = signal('');
  protected readonly details = signal('');
  protected readonly categories = signal<StoreDocument<Category>[]>([]);

  protected setTextFromEvent(target: WritableSignal<string>, event: Event): void {
    target.set(inputValueFromEvent(event));
  }

  protected async onTypeChange(event: Event): Promise<void> {
    const nextType = inputValueFromEvent(event) as CategoryType | '';

    this.type.set(nextType);
    this.categoryId.set('');

    if (nextType === '') {
      this.categories.set([]);

      return;
    }

    await runWhilePending(async () => {
      const listed = await this.categoryService.listByType(nextType);

      if (this.type() !== nextType) {
        return;
      }

      this.categories.set(listed);
    }, this.pendingTasks);
  }
}
