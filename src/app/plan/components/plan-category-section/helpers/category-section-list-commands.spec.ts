import type { PendingTasks, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { CategoryType } from '../../../../../data/domains/category/category';
import type { RevisionCounter } from '../types';
import { attemptMutation, loadCategories } from './category-section-list-commands';

interface ListCommandsContextOptions {
  error: WritableSignal<string | null>;
  type?: () => CategoryType;
}

describe('loadCategories', () => {
  it('clears the error and runs refresh', async () => {
    const { error, revisionCounter, context } = createTestContext('prior');

    let refreshed = false;

    await loadCategories(
      () => {
        refreshed = true;
        return Promise.resolve();
      },
      { revisionCounter, context },
    );

    expect(error()).toBeNull();
    expect(refreshed).toBe(true);
  });

  it('sets a load error when refresh fails and the revision is still current', async () => {
    const { error, revisionCounter, context } = createTestContext();

    await loadCategories(() => Promise.reject(new Error('unavailable')), {
      revisionCounter,
      context,
    });

    expect(error()).toBe('Could not load categories. Refresh and try again.');
  });

  it('skips the load error when the type changes mid-flight', async () => {
    const type = signal<CategoryType>('income');

    const { error, revisionCounter } = createTestContext();
    const context = createListCommandsContext({
      type: () => type(),
      error,
    });

    await loadCategories(
      () => {
        type.set('expense');
        return Promise.reject(new Error('unavailable'));
      },
      { revisionCounter, context },
    );

    expect(error()).toBeNull();
  });

  it('skips the load error when a newer revision has begun', async () => {
    const { error, revisionCounter, context } = createTestContext();

    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    const pending = loadCategories(
      async () => {
        await refreshGate;
        throw new Error('unavailable');
      },
      { revisionCounter, context },
    );
    await Promise.resolve();
    revisionCounter.next();
    releaseRefresh();
    await pending;

    expect(error()).toBeNull();
  });
});

describe('attemptMutation', () => {
  it('runs the mutation then refresh and clears a prior error', async () => {
    const { error, revisionCounter, context } = createTestContext('prior');

    const steps: string[] = [];

    await attemptMutation(
      () => {
        steps.push('mutation');
        return Promise.resolve();
      },
      {
        refresh: () => {
          steps.push('refresh');
          return Promise.resolve();
        },
        revisionCounter,
        context,
      },
    );

    expect(steps).toEqual(['mutation', 'refresh']);
    expect(error()).toBeNull();
  });

  it('sets a save error when the mutation fails and the revision is still current', async () => {
    const { error, revisionCounter, context } = createTestContext();

    await attemptMutation(() => Promise.reject(new Error('unavailable')), {
      refresh: () => Promise.resolve(),
      revisionCounter,
      context,
    });

    expect(error()).toBe('Could not save the category. Try again.');
  });

  it('skips the save error when the type changes mid-flight', async () => {
    const type = signal<CategoryType>('income');

    const { error, revisionCounter } = createTestContext();
    const context = createListCommandsContext({
      type: () => type(),
      error,
    });

    await attemptMutation(
      () => {
        type.set('expense');
        return Promise.reject(new Error('unavailable'));
      },
      {
        refresh: () => Promise.resolve(),
        revisionCounter,
        context,
      },
    );

    expect(error()).toBeNull();
  });

  it('skips the save error when a newer revision has begun', async () => {
    const { error, revisionCounter, context } = createTestContext();

    let releaseMutation!: () => void;
    const mutationGate = new Promise<void>((resolve) => {
      releaseMutation = resolve;
    });

    const pending = attemptMutation(
      async () => {
        await mutationGate;
        throw new Error('unavailable');
      },
      {
        refresh: () => Promise.resolve(),
        revisionCounter,
        context,
      },
    );
    await Promise.resolve();
    revisionCounter.next();
    releaseMutation();
    await pending;

    expect(error()).toBeNull();
  });
});

function createTestContext(initialError: string | null = null) {
  const error = signal<string | null>(initialError);
  const revisionCounter = createRevisionCounter();

  return { error, revisionCounter, context: createListCommandsContext({ error }) };
}

function createListCommandsContext(options: ListCommandsContextOptions) {
  return {
    pendingTasks: {
      add: () => () => undefined,
    } as PendingTasks,
    type: options.type ?? (() => 'income' as CategoryType),
    error: options.error,
  };
}

function createRevisionCounter(): RevisionCounter {
  let latestRevision = 0;

  return {
    next: () => ++latestRevision,
    isLatest: (revision) => revision === latestRevision,
  };
}
