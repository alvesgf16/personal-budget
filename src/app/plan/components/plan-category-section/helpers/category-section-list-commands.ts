import type { PendingTasks, WritableSignal } from '@angular/core';
import type { CategoryType } from '../../../../../data/domains/category/category';
import { attemptWhilePending } from '../../../../shared/helpers/attempt-while-pending';
import type { RevisionCounter } from '../types';

interface ListCommandsContext {
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
}

interface LoadCategoriesOptions {
  revisionCounter: RevisionCounter;
  context: ListCommandsContext;
}

interface AttemptMutationOptions {
  refresh: () => Promise<void>;
  revisionCounter: RevisionCounter;
  context: ListCommandsContext;
}

interface AttemptWorkOptions {
  revisionCounter: RevisionCounter;
  failMessage: string;
  context: ListCommandsContext;
}

interface AttemptSnapshot {
  categoryType: CategoryType;
  revision: number;
}

interface FailureReport {
  snapshot: AttemptSnapshot;
  failMessage: string;
  context: ListCommandsContext;
}

export async function loadCategories(
  refresh: () => Promise<void>,
  { revisionCounter, context }: LoadCategoriesOptions,
): Promise<void> {
  await attemptWork(refresh, {
    revisionCounter,
    failMessage: 'Could not load categories. Refresh and try again.',
    context,
  });
}

export async function attemptMutation(
  mutation: () => Promise<unknown>,
  { refresh, revisionCounter, context }: AttemptMutationOptions,
): Promise<void> {
  await attemptWork(() => mutateThenRefresh(mutation, refresh), {
    revisionCounter,
    failMessage: 'Could not save the category. Try again.',
    context,
  });
}

async function mutateThenRefresh(
  mutation: () => Promise<unknown>,
  refresh: () => Promise<void>,
): Promise<void> {
  await mutation();
  await refresh();
}

async function attemptWork(
  work: () => Promise<void>,
  { revisionCounter, failMessage, context }: AttemptWorkOptions,
): Promise<void> {
  const snapshot = captureAttempt(revisionCounter, context.type);

  await attemptWhilePending(
    () => clearErrorThen(work, context.error),
    context.pendingTasks,
    () => reportFailureIfStillRelevant(revisionCounter, { snapshot, failMessage, context }),
  );
}

function captureAttempt(
  revisionCounter: RevisionCounter,
  type: () => CategoryType,
): AttemptSnapshot {
  return {
    categoryType: type(),
    revision: revisionCounter.next(),
  };
}

async function clearErrorThen(
  run: () => Promise<void>,
  error: WritableSignal<string | null>,
): Promise<void> {
  error.set(null);
  await run();
}

function reportFailureIfStillRelevant(
  revisionCounter: RevisionCounter,
  { snapshot, failMessage, context }: FailureReport,
): void {
  if (revisionCounter.isLatest(snapshot.revision) && context.type() === snapshot.categoryType) {
    context.error.set(failMessage);
  }
}
