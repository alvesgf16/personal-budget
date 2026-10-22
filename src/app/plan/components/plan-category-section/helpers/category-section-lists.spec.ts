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

  it('discards an older refresh when a newer one finishes first', async () => {
    const firstList = createHoldGate();
    let listCalls = 0;
    const stale = [categoryDoc('old', 'Stale')];
    const fresh = [categoryDoc('new', 'Fresh')];
    const { lists, activeCategories } = listsHarness({
      categoryService: {
        listByType: async () => {
          listCalls += 1;
          if (listCalls === 1) {
            await firstList.wait;
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
    firstList.release();
    await firstLoad;

    expect(activeCategories()).toEqual(fresh);
  });

  it('discards a mutation refresh that finishes after a newer load', async () => {
    const mutationGate = createHoldGate();
    let listCalls = 0;
    const stale = [categoryDoc('old', 'Stale')];
    const fresh = [categoryDoc('new', 'Fresh')];
    const { lists, activeCategories } = listsHarness({
      categoryService: {
        listByType: () => {
          listCalls += 1;
          return Promise.resolve(listCalls === 1 ? fresh : stale);
        },
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    const pendingMutation = lists.attemptMutation(async () => {
      await mutationGate.wait;
    });
    await Promise.resolve();
    await lists.load();
    mutationGate.release();
    await pendingMutation;

    expect(listCalls).toBe(2);
    expect(activeCategories()).toEqual(fresh);
  });

  it('reloads lists when a mutation fails while an older load is pending', async () => {
    const firstList = createHoldGate();
    let listCalls = 0;
    const existing = [categoryDoc('a', 'Salary')];
    const { lists, activeCategories, error } = listsHarness({
      categoryService: {
        listByType: async () => {
          listCalls += 1;
          if (listCalls === 1) {
            await firstList.wait;
          }
          return existing;
        },
        listHiddenByType: () => Promise.resolve([]),
      },
    });

    const pendingLoad = lists.load();
    await Promise.resolve();
    await lists.attemptMutation(() => Promise.reject(new Error('unavailable')));
    firstList.release();
    await pendingLoad;

    expect(activeCategories()).toEqual(existing);
    expect(error()).toBe('Could not save the category. Try again.');
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

interface HoldGate {
  wait: Promise<void>;
  release: () => void;
}

function createHoldGate(): HoldGate {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { wait, release };
}

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
