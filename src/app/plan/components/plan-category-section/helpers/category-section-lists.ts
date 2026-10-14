import type { PendingTasks, WritableSignal } from '@angular/core';
import type { Category, CategoryType } from '../../../../../data/domains/category/category';
import type { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';
import { attemptWhilePending } from '../../../../shared/helpers/attempt-while-pending';
import { listSectionCategoriesIfCurrent } from './list-section-categories';

interface CategorySectionListsDeps {
  categoryService: Pick<CategoryService, 'listByType' | 'listHiddenByType'>;
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
  activeCategories: WritableSignal<StoreDocument<Category>[]>;
  hiddenCategories: WritableSignal<StoreDocument<Category>[]>;
}

export interface CategorySectionLists {
  load: () => Promise<void>;
  attemptMutation: (mutation: () => Promise<unknown>) => Promise<void>;
}

/** Load / mutation refresh with generation guards for overlapping async. */
export function createCategorySectionLists(deps: CategorySectionListsDeps): CategorySectionLists {
  const refresh = createRefresh(deps);

  return {
    load: () => loadCategories(deps, refresh),
    attemptMutation: (mutation: () => Promise<unknown>) =>
      mutateThenRefresh(deps, refresh, mutation),
  };
}

function createRefresh(deps: CategorySectionListsDeps): () => Promise<void> {
  let loadGeneration = 0;

  return async () => {
    const type = deps.type();
    const generation = ++loadGeneration;
    const lists = await listSectionCategoriesIfCurrent(
      deps.categoryService,
      type,
      () => generation === loadGeneration && deps.type() === type,
    );

    if (!lists) {
      return;
    }

    deps.activeCategories.set(lists.active);
    deps.hiddenCategories.set(lists.hidden);
  };
}

async function loadCategories(
  deps: CategorySectionListsDeps,
  refresh: () => Promise<void>,
): Promise<void> {
  const type = deps.type();

  await attemptWhilePending(
    async () => {
      deps.error.set(null);
      await refresh();
    },
    deps.pendingTasks,
    () => {
      if (deps.type() === type) {
        deps.error.set('Could not load categories. Refresh and try again.');
      }
    },
  );
}

async function mutateThenRefresh(
  deps: CategorySectionListsDeps,
  refresh: () => Promise<void>,
  mutation: () => Promise<unknown>,
): Promise<void> {
  const type = deps.type();

  await attemptWhilePending(
    () => runWorkThenRefresh(deps, refresh, mutation),
    deps.pendingTasks,
    () => {
      if (deps.type() === type) {
        deps.error.set('Could not save the category. Try again.');
      }
    },
  );
}

async function runWorkThenRefresh(
  deps: CategorySectionListsDeps,
  refresh: () => Promise<void>,
  work: () => Promise<unknown>,
): Promise<void> {
  deps.error.set(null);
  await work();
  await refresh();
}
