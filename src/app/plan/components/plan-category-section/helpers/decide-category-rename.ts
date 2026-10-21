import { parseCategoryName, type Category } from '../../../../../data/domains/category/category';
import type { StoreDocument } from '../../../../../data/store/types';

export type CategoryRenameOutcome =
  { status: 'empty-or-invalid' } | { status: 'unchanged' } | { status: 'ok'; categoryName: string };

export function decideCategoryRename(
  categoryId: string,
  typedName: string,
  activeCategories: StoreDocument<Category>[],
): CategoryRenameOutcome {
  const categoryName = parseCategoryName(typedName);

  if (!categoryName) {
    return { status: 'empty-or-invalid' };
  }

  if (isNameUnchanged(categoryId, categoryName, activeCategories)) {
    return { status: 'unchanged' };
  }

  return { status: 'ok', categoryName };
}

function isNameUnchanged(
  categoryId: string,
  categoryName: string,
  activeCategories: StoreDocument<Category>[],
): boolean {
  return activeCategories.some(
    (category) => category.id === categoryId && category.name === categoryName,
  );
}
