import type { PendingTasks, WritableSignal } from '@angular/core';
import type { Category, CategoryType } from '../../../../../data/domains/category/category';
import type { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';
import type { RevisionCounter, TypeSnapshot } from '../types';
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
  attemptMutation: (mutation: () => Promise<unknown>) => Promise<void>;
}

interface CategoryLists {
  active: StoreDocument<Category>[];
  hidden: StoreDocument<Category>[];
}

export function createCategorySectionLists(
  context: CategorySectionListsContext,
): CategorySectionLists {
  const revisionCounter = createRevisionCounter();
  const refresh = createRefresh(revisionCounter, context);

  return {
    load: () => loadCategories(refresh, { revisionCounter, context }),
    attemptMutation: (mutation: () => Promise<unknown>) =>
      runAttemptMutation(mutation, { refresh, revisionCounter, context }),
  };
}

function createRefresh(
  revisionCounter: RevisionCounter,
  context: CategorySectionListsContext,
): (revision: number) => Promise<void> {
  return async (revision) => {
    const snapshot: TypeSnapshot = {
      type: context.type(),
      revision,
    };
    const lists = await listSectionCategoriesIfSnapshotMatches(
      context.categoryService,
      snapshot.type,
      () => matchesSnapshot(revisionCounter, snapshot, context),
    );
    applyCategoryLists(lists, context);
  };
}

function matchesSnapshot(
  revisionCounter: RevisionCounter,
  snapshot: TypeSnapshot,
  context: CategorySectionListsContext,
): boolean {
  return snapshot.revision === revisionCounter.current() && context.type() === snapshot.type;
}

function applyCategoryLists(
  lists: CategoryLists | null,
  context: CategorySectionListsContext,
): void {
  if (!lists) {
    return;
  }

  context.activeCategories.set(lists.active);
  context.hiddenCategories.set(lists.hidden);
}

async function listSectionCategoriesIfSnapshotMatches(
  categoryService: Pick<CategoryService, 'listByType' | 'listHiddenByType'>,
  type: CategoryType,
  snapshotMatches: () => boolean,
): Promise<CategoryLists | null> {
  const [active, hidden] = await Promise.all([
    categoryService.listByType(type),
    categoryService.listHiddenByType(type),
  ]);

  return snapshotMatches() ? { active, hidden } : null;
}
