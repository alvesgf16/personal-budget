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

  protected readonly nameInput = signal('');

  constructor() {
    effect(() => {
      this.nameInput.set(this.name());
    });
  }

  protected onNameInput(event: Event): void {
    this.nameInput.set((event.target as HTMLInputElement).value);
  }

  protected commit(): void {
    const typedName = this.nameInput();

    if (typedName === this.name()) {
      return;
    }

    this.revertBlankNameInputLocally(typedName);
    // Parent still receives the event for the blank-name alert.
    this.nameChange.emit({ id: this.categoryId(), name: typedName });
  }

  private revertBlankNameInputLocally(typedName: string): void {
    if (!parseCategoryName(typedName)) {
      this.nameInput.set(this.name());
    }
  }
}
