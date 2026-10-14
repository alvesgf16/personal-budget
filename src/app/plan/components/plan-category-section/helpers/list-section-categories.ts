import type { Category, CategoryType } from '../../../../../data/domains/category/category';
import type { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';

interface CategoryLists {
  active: StoreDocument<Category>[];
  hidden: StoreDocument<Category>[];
}

export async function listSectionCategoriesIfCurrent(
  categoryService: Pick<CategoryService, 'listByType' | 'listHiddenByType'>,
  type: CategoryType,
  isCurrent: () => boolean,
): Promise<CategoryLists | null> {
  const [active, hidden] = await Promise.all([
    categoryService.listByType(type),
    categoryService.listHiddenByType(type),
  ]);

  return isCurrent() ? { active, hidden } : null;
}
