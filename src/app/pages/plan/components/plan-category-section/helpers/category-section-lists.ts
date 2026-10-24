import type { PendingTasks, WritableSignal } from '@angular/core';
import type { Category } from '../../../../../../data/domains/category/category';
import type { CategoryType } from '../../../../../../data/lib/category-type';
import type { CategoryService } from '../../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../../data/store/types';
import {
  createRevisionCounter,
  type RevisionCounter,
} from '../../../../../shared/helpers/create-revision-counter';
import type { CategoryTypeSnapshot } from '../types';
import {
  attemptMutation as runAttemptMutation,
  loadCategories,
  matchesSnapshot,
} from './category-section-list-commands';

interface CategorySectionListsContext {
  categoryService: Pick<CategoryService, 'listPartitionedByType'>;
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
  const refresh = createRefresh(revisionCounter, context);

  return {
    load: () => loadCategories(refresh, { revisionCounter, context }),
    attemptMutation: (mutation: () => Promise<void>) =>
      runAttemptMutation(mutation, { refresh, revisionCounter, context }),
  };
}

function createRefresh(
  revisionCounter: RevisionCounter,
  context: CategorySectionListsContext,
): (revision: number) => Promise<void> {
  return async (revision) => {
    const snapshot: CategoryTypeSnapshot = {
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
  categoryService: Pick<CategoryService, 'listPartitionedByType'>,
  type: CategoryType,
  snapshotMatches: () => boolean,
): Promise<CategoryLists | null> {
  const lists = await categoryService.listPartitionedByType(type);

  return snapshotMatches() ? lists : null;
}
