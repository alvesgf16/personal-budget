import type { PendingTasks, WritableSignal } from '@angular/core';
import type { Category, CategoryType } from '../../../../../data/domains/category/category';
import type { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';
import type { OperationGeneration } from '../types';
import {
  attemptMutation as runAttemptMutation,
  loadCategories,
} from './category-section-list-commands';

interface CategorySectionListsDeps {
  categoryService: Pick<CategoryService, 'listByType' | 'listHiddenByType'>;
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
  activeCategories: WritableSignal<StoreDocument<Category>[]>;
  hiddenCategories: WritableSignal<StoreDocument<Category>[]>;
}

interface CategorySectionLists {
  load: () => Promise<void>;
  attemptMutation: (mutation: () => Promise<void>) => Promise<void>;
}

interface CategoryLists {
  active: StoreDocument<Category>[];
  hidden: StoreDocument<Category>[];
}

export function createCategorySectionLists(deps: CategorySectionListsDeps): CategorySectionLists {
  const operations = createOperationGeneration();
  const refresh = createRefresh(deps);

  return {
    load: () => loadCategories({ refresh, operations, deps }),
    attemptMutation: (mutation: () => Promise<void>) =>
      runAttemptMutation({ refresh, mutation, operations, deps }),
  };
}

function createOperationGeneration(): OperationGeneration {
  let operationGeneration = 0;

  return {
    begin: () => ++operationGeneration,
    current: () => operationGeneration,
  };
}

function createRefresh(deps: CategorySectionListsDeps): () => Promise<void> {
  return async () => {
    const lists = await listSectionCategories(deps.categoryService, deps.type());
    applyCategoryLists(lists, deps);
  };
}

function applyCategoryLists(lists: CategoryLists, deps: CategorySectionListsDeps): void {
  deps.activeCategories.set(lists.active);
  deps.hiddenCategories.set(lists.hidden);
}

async function listSectionCategories(
  categoryService: Pick<CategoryService, 'listByType' | 'listHiddenByType'>,
  type: CategoryType,
): Promise<CategoryLists> {
  const [active, hidden] = await Promise.all([
    categoryService.listByType(type),
    categoryService.listHiddenByType(type),
  ]);

  return { active, hidden };
}
