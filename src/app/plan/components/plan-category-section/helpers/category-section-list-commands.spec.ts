import type { PendingTasks, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { CategoryType } from '../../../../../data/domains/category/category';
import type { OperationGeneration } from '../types';
import { attemptMutation, loadCategories } from './category-section-list-commands';

interface CommandDepsOptions {
  error: WritableSignal<string | null>;
  type?: () => CategoryType;
}

describe('loadCategories', () => {
  it('clears the error and runs refresh', async () => {
    const error = signal<string | null>('prior');
    let refreshed = false;

    await loadCategories({
      refresh: () => {
        refreshed = true;
        return Promise.resolve();
      },
      operations: operationGeneration(),
      deps: commandDeps({ error }),
    });

    expect(error()).toBeNull();
    expect(refreshed).toBe(true);
  });

  it('sets a load error when refresh fails and the operation is still current', async () => {
    const error = signal<string | null>(null);

    await loadCategories({
      refresh: () => Promise.reject(new Error('unavailable')),
      operations: operationGeneration(),
      deps: commandDeps({ error }),
    });

    expect(error()).toBe('Could not load categories. Refresh and try again.');
  });
});

describe('attemptMutation', () => {
  it('runs the mutation then refresh and clears a prior error', async () => {
    const error = signal<string | null>('prior');
    const steps: string[] = [];

    await attemptMutation({
      refresh: () => {
        steps.push('refresh');
        return Promise.resolve();
      },
      mutation: () => {
        steps.push('mutation');
        return Promise.resolve();
      },
      operations: operationGeneration(),
      deps: commandDeps({ error }),
    });

    expect(steps).toEqual(['mutation', 'refresh']);
    expect(error()).toBeNull();
  });

  it('sets a save error when the mutation fails and the operation is still current', async () => {
    const error = signal<string | null>(null);

    await attemptMutation({
      refresh: () => Promise.resolve(),
      mutation: () => Promise.reject(new Error('unavailable')),
      operations: operationGeneration(),
      deps: commandDeps({ error }),
    });

    expect(error()).toBe('Could not save the category. Try again.');
  });
});

function commandDeps(options: CommandDepsOptions) {
  return {
    pendingTasks: {
      add: () => () => undefined,
    } as PendingTasks,
    type: options.type ?? (() => 'income' as CategoryType),
    error: options.error,
  };
}

function operationGeneration(): OperationGeneration {
  let generation = 0;

  return {
    begin: () => ++generation,
    current: () => generation,
  };
}
