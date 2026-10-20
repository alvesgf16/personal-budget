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

interface RefreshSnapshot {
  type: CategoryType;
  generation: number;
}

export function createCategorySectionLists(deps: CategorySectionListsDeps): CategorySectionLists {
  const operations = createOperationGeneration();
  const refresh = createRefresh(operations, deps);

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

function createRefresh(
  operations: OperationGeneration,
  deps: CategorySectionListsDeps,
): () => Promise<void> {
  return async () => {
    const snapshot: RefreshSnapshot = {
      type: deps.type(),
      generation: operations.current(),
    };
    const lists = await listSectionCategoriesIfCurrent(deps.categoryService, snapshot.type, () =>
      isCurrentRefresh(operations, snapshot, deps),
    );
    applyCategoryLists(lists, deps);
  };
}

function isCurrentRefresh(
  operations: OperationGeneration,
  snapshot: RefreshSnapshot,
  deps: CategorySectionListsDeps,
): boolean {
  return snapshot.generation === operations.current() && deps.type() === snapshot.type;
}

function applyCategoryLists(lists: CategoryLists | null, deps: CategorySectionListsDeps): void {
  if (!lists) {
    return;
  }

  deps.activeCategories.set(lists.active);
  deps.hiddenCategories.set(lists.hidden);
}

async function listSectionCategoriesIfCurrent(
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
