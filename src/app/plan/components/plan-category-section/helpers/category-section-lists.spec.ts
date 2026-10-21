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

  it('load sets an error when listing fails', async () => {
    const { lists, error } = listsHarness({
      categoryService: {
        listByType: () => Promise.reject(new Error('unavailable')),
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    await lists.load();

    expect(error()).toBe('Could not load categories. Refresh and try again.');
  });

  it('attemptMutation runs the mutation then refreshes lists', async () => {
    const active = [categoryDoc('a', 'Salary')];
    const steps: string[] = [];
    const { lists, activeCategories } = listsHarness({
      categoryService: {
        listByType: () => {
          steps.push('listByType');
          return Promise.resolve(active);
        },
        listHiddenByType: () => {
          steps.push('listHiddenByType');
          return Promise.resolve([]);
        },
      },
    });

    await lists.attemptMutation(() => {
      steps.push('mutation');
      return Promise.resolve();
    });

    expect(steps[0]).toBe('mutation');
    expect(steps.slice(1).sort()).toEqual(['listByType', 'listHiddenByType']);
    expect(activeCategories()).toEqual(active);
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
