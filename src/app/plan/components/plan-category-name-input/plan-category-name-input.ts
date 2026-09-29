import { Component, effect, input, output, signal } from '@angular/core';
import { parseCategoryName } from '../../../../data/domains/category/category';

/** Inline category name field: local draft, emit on blur when the value changed. */
@Component({
  selector: 'app-plan-category-name-input',
  styleUrl: './plan-category-name-input.css',
  templateUrl: './plan-category-name-input.html',
})
export class PlanCategoryNameInput {
  readonly categoryId = input.required<string>();
  readonly name = input.required<string>();
  readonly nameChange = output<{ id: string; name: string }>();

  protected readonly draft = signal('');

  constructor() {
    effect(() => {
      this.draft.set(this.name());
    });
  }

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected commit(): void {
    const raw = this.draft();
    if (raw === this.name()) {
      return;
    }
    // Revert blank drafts locally; parent still receives the event for the alert.
    if (!parseCategoryName(raw)) {
      this.draft.set(this.name());
    }
    this.nameChange.emit({ id: this.categoryId(), name: raw });
  }
}
