import type { PendingTasks, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { Category, CategoryType } from '../../../../../data/domains/category/category';
import type { CategoryService } from '../../../../../data/domains/category/category.service';
import type { StoreDocument } from '../../../../../data/store/types';
import { createCategorySectionLists } from './category-section-lists';

interface ListsHarnessOptions {
  categoryService: Pick<CategoryService, 'listByType' | 'listHiddenByType'>;
  type?: WritableSignal<CategoryType>;
}

describe('createCategorySectionLists', () => {
  it('load sets active and hidden category signals', async () => {
    const active = [categoryDoc('a', 'Salary')];
    const hidden = [categoryDoc('h', 'Old', false)];
    const { lists, activeCategories, hiddenCategories, error } = listsHarness({
      categoryService: stubLists(active, hidden),
    });

    await lists.load();

    expect(activeCategories()).toEqual(active);
    expect(hiddenCategories()).toEqual(hidden);
    expect(error()).toBeNull();
  });

  it('load sets an error when listing fails and the type is unchanged', async () => {
    const { lists, error } = listsHarness({
      categoryService: {
        listByType: () => Promise.reject(new Error('unavailable')),
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    await lists.load();

    expect(error()).toBe('Could not load categories. Refresh and try again.');
  });

  it('load skips the error when the type changes mid-flight', async () => {
    const type = signal<CategoryType>('income');
    const { lists, error } = listsHarness({
      type,
      categoryService: {
        listByType: () => {
          type.set('expense');
          return Promise.reject(new Error('unavailable'));
        },
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    await lists.load();

    expect(error()).toBeNull();
  });

  it('attemptMutation runs the mutation then refreshes lists', async () => {
    const active = [categoryDoc('a', 'Salary')];
    let mutated = false;
    const { lists, activeCategories } = listsHarness({
      categoryService: stubLists(active, []),
    });

    await lists.attemptMutation(() => {
      mutated = true;
      return Promise.resolve();
    });

    expect(mutated).toBe(true);
    expect(activeCategories()).toEqual(active);
  });

  it('attemptMutation sets an error when the mutation fails', async () => {
    const { lists, error } = listsHarness({
      categoryService: stubLists([], []),
    });

    await lists.attemptMutation(() => Promise.reject(new Error('unavailable')));

    expect(error()).toBe('Could not save the category. Try again.');
  });

  it('attemptMutation skips the error when the type changes mid-flight', async () => {
    const type = signal<CategoryType>('income');
    const { lists, error } = listsHarness({
      type,
      categoryService: stubLists([], []),
    });

    await lists.attemptMutation(() => {
      type.set('expense');
      return Promise.reject(new Error('unavailable'));
    });

    expect(error()).toBeNull();
  });

  it('discards an older refresh when a newer one finishes first', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let listCalls = 0;
    const stale = [categoryDoc('old', 'Stale')];
    const fresh = [categoryDoc('new', 'Fresh')];
    const { lists, activeCategories } = listsHarness({
      categoryService: {
        listByType: async () => {
          listCalls += 1;
          if (listCalls === 1) {
            await firstGate;
            return stale;
          }
          return fresh;
        },
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    const firstLoad = lists.load();
    await Promise.resolve();
    await lists.load();
    releaseFirst();
    await firstLoad;

    expect(activeCategories()).toEqual(fresh);
  });

  it('discards refresh results when the type changes mid-flight', async () => {
    const type = signal<CategoryType>('income');
    const { lists, activeCategories } = listsHarness({
      type,
      categoryService: {
        listByType: () => {
          type.set('expense');
          return Promise.resolve([categoryDoc('a', 'Salary')]);
        },
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    await lists.load();

    expect(activeCategories()).toEqual([]);
  });
});

function categoryDoc(id: string, name: string, active = true): StoreDocument<Category> {
  return {
    id,
    name,
    type: 'income',
    sortOrder: 0,
    active,
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}

function stubLists(active: StoreDocument<Category>[], hidden: StoreDocument<Category>[]) {
  return {
    listByType: () => Promise.resolve(active),
    listHiddenByType: () => Promise.resolve(hidden),
  };
}

function stubPendingTasks(): PendingTasks {
  return {
    add: () => () => undefined,
  } as PendingTasks;
}

function listsHarness(options: ListsHarnessOptions) {
  const type = options.type ?? signal<CategoryType>('income');
  const error = signal<string | null>(null);
  const activeCategories = signal<StoreDocument<Category>[]>([]);
  const hiddenCategories = signal<StoreDocument<Category>[]>([]);
  const lists = createCategorySectionLists({
    categoryService: options.categoryService,
    pendingTasks: stubPendingTasks(),
    type: () => type(),
    error,
    activeCategories,
    hiddenCategories,
  });

  return { lists, activeCategories, hiddenCategories, error, type };
}
