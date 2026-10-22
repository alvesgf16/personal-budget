import type { PendingTasks, WritableSignal } from '@angular/core';
import type { CategoryType } from '../../../../../data/domains/category/category';
import { attemptWhilePending } from '../../../../shared/helpers/attempt-while-pending';
import type { RevisionCounter, TypeSnapshot } from '../types';

interface ListCommandsContext {
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
}

type RefreshLists = (revision: number) => Promise<void>;

interface LoadCategoriesOptions {
  revisionCounter: RevisionCounter;
  context: ListCommandsContext;
}

interface AttemptMutationOptions {
  refresh: RefreshLists;
  revisionCounter: RevisionCounter;
  context: ListCommandsContext;
}

interface RunAttemptOptions {
  revisionCounter: RevisionCounter;
  failMessage: string;
  context: ListCommandsContext;
}

interface FailureReportOptions {
  snapshot: TypeSnapshot;
  failMessage: string;
  context: ListCommandsContext;
}

export async function loadCategories(
  refresh: RefreshLists,
  { revisionCounter, context }: LoadCategoriesOptions,
): Promise<void> {
  await runAttempt(refresh, {
    revisionCounter,
    failMessage: 'Could not load categories. Refresh and try again.',
    context,
  });
}

export async function attemptMutation(
  mutation: () => Promise<unknown>,
  { refresh, revisionCounter, context }: AttemptMutationOptions,
): Promise<void> {
  await runAttempt((revision) => mutateThenRefresh(mutation, () => refresh(revision)), {
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

async function runAttempt(
  run: RefreshLists,
  { revisionCounter, failMessage, context }: RunAttemptOptions,
): Promise<void> {
  const snapshot = captureAttempt(revisionCounter, context.type);

  await attemptWhilePending(
    () => clearErrorThen(() => run(snapshot.revision), context.error),
    context.pendingTasks,
    () => reportFailureIfStillRelevant(revisionCounter, { snapshot, failMessage, context }),
  );
}

function captureAttempt(revisionCounter: RevisionCounter, type: () => CategoryType): TypeSnapshot {
  return {
    type: type(),
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
  { snapshot, failMessage, context }: FailureReportOptions,
): void {
  if (matchesSnapshot(revisionCounter, snapshot, context)) {
    context.error.set(failMessage);
  }
}

function matchesSnapshot(
  revisionCounter: RevisionCounter,
  snapshot: TypeSnapshot,
  context: ListCommandsContext,
): boolean {
  return snapshot.revision === revisionCounter.current() && context.type() === snapshot.type;
}
