import type { PendingTasks, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { CategoryType } from '../../../../../data/domains/category/category';
import {
  captureAttempt,
  clearErrorThen,
  matchesSnapshot,
  reportFailureIfStillRelevant,
  type ListCommandsContext,
} from './category-section-list-snapshots';
import { createRevisionCounter } from './create-revision-counter';

describe('captureAttempt', () => {
  it('records the current type and the next revision', () => {
    const revisionCounter = createRevisionCounter();

    const snapshot = captureAttempt(revisionCounter, () => 'expense');

    expect(snapshot).toEqual({ type: 'expense', revision: 1 });
    expect(revisionCounter.current()).toBe(1);
  });
});

describe('clearErrorThen', () => {
  it('clears the error before running work', async () => {
    const error = signal<string | null>('prior');
    const steps: string[] = [];

    await clearErrorThen(() => {
      steps.push(`error:${error()}`);
      return Promise.resolve();
    }, error);

    expect(steps).toEqual(['error:null']);
    expect(error()).toBeNull();
  });
});

describe('matchesSnapshot', () => {
  it('is true when revision and type still match', () => {
    const { revisionCounter, context } = createSnapshotHarness();
    const snapshot = captureAttempt(revisionCounter, context.type);

    expect(matchesSnapshot(revisionCounter, snapshot, context)).toBe(true);
  });

  it('is false when a newer revision has begun', () => {
    const { revisionCounter, context } = createSnapshotHarness();
    const snapshot = captureAttempt(revisionCounter, context.type);
    revisionCounter.next();

    expect(matchesSnapshot(revisionCounter, snapshot, context)).toBe(false);
  });

  it('is false when the type has changed', () => {
    const type = signal<CategoryType>('income');
    const { revisionCounter, context } = createSnapshotHarness(() => type());
    const snapshot = captureAttempt(revisionCounter, context.type);
    type.set('expense');

    expect(matchesSnapshot(revisionCounter, snapshot, context)).toBe(false);
  });
});

describe('reportFailureIfStillRelevant', () => {
  it('sets the failure message when the snapshot is still current', () => {
    const { error, revisionCounter, context } = createSnapshotHarness();
    const snapshot = captureAttempt(revisionCounter, context.type);

    reportFailureIfStillRelevant(revisionCounter, {
      snapshot,
      failMessage: 'Could not save the category. Try again.',
      context,
    });

    expect(error()).toBe('Could not save the category. Try again.');
  });

  it('skips the failure message when the snapshot is stale', () => {
    const { error, revisionCounter, context } = createSnapshotHarness();
    const snapshot = captureAttempt(revisionCounter, context.type);
    revisionCounter.next();

    reportFailureIfStillRelevant(revisionCounter, {
      snapshot,
      failMessage: 'Could not save the category. Try again.',
      context,
    });

    expect(error()).toBeNull();
  });
});

function createSnapshotHarness(type: () => CategoryType = () => 'income') {
  const error = signal<string | null>(null);
  const revisionCounter = createRevisionCounter();
  const context = createListCommandsContext(error, type);

  return { error, revisionCounter, context };
}

function createListCommandsContext(
  error: WritableSignal<string | null>,
  type: () => CategoryType,
): ListCommandsContext {
  return {
    pendingTasks: {
      add: () => () => undefined,
    } as PendingTasks,
    type,
    error,
  };
}
