import { Component, effect, input, output, signal } from '@angular/core';
import { parseCategoryName } from '../../../../data/domains/category/category';

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
    this.revertBlankDraftLocally(raw);
    // Parent still receives the event for the blank-name alert.
    this.nameChange.emit({ id: this.categoryId(), name: raw });
  }

  private revertBlankDraftLocally(raw: string): void {
    if (!parseCategoryName(raw)) {
      this.draft.set(this.name());
    }
  }
}
