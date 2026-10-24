import type { CategoryRef } from './category-ref';

export function sumOverActiveCategories(
  categories: readonly CategoryRef[],
  score: (category: CategoryRef) => number,
): number {
  let total = 0;

  for (const category of categories) {
    if (!category.active) {
      continue;
    }

    total += score(category);
  }

  return total;
}

export function filterActiveCategories<Category extends CategoryRef>(
  categories: readonly Category[],
): Category[] {
  return categories.filter((category) => category.active);
}
