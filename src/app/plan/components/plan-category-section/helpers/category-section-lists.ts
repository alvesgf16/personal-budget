import type { PendingTasks, WritableSignal } from '@angular/core';
import type { Category, CategoryType } from '../../../../../data/domains/category/category';
import type { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';
import {
  attemptMutation as runAttemptMutation,
  loadCategories,
} from './category-section-list-commands';
import { createRevisionCounter } from './create-revision-counter';

interface CategorySectionListsContext {
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

export function createCategorySectionLists(
  context: CategorySectionListsContext,
): CategorySectionLists {
  const revisionCounter = createRevisionCounter();
  const refresh = createRefresh(context);

  return {
    load: () => loadCategories(refresh, { revisionCounter, context }),
    attemptMutation: (mutation: () => Promise<void>) =>
      runAttemptMutation(mutation, { refresh, revisionCounter, context }),
  };
}

function createRefresh(context: CategorySectionListsContext): () => Promise<void> {
  return async () => {
    const lists = await listSectionCategories(context.categoryService, context.type());
    applyCategoryLists(lists, context);
  };
}

function applyCategoryLists(lists: CategoryLists, context: CategorySectionListsContext): void {
  context.activeCategories.set(lists.active);
  context.hiddenCategories.set(lists.hidden);
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
