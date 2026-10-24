import type { PendingTasks, WritableSignal } from '@angular/core';
import type { CategoryType } from '../../../../../../data/domains/category/category';
import { attemptWhilePending } from '../../../../../shared/helpers/attempt-while-pending';
import type { RevisionCounter } from '../../../../../shared/helpers/create-revision-counter';
import { runWhilePending } from '../../../../../shared/helpers/run-while-pending';
import type { CategoryTypeSnapshot } from '../types';

export interface ListCommandsContext {
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
}

export type RefreshLists = (revision: number) => Promise<void>;

interface AttemptOptions {
  refresh: RefreshLists;
  revisionCounter: RevisionCounter;
  context: ListCommandsContext;
}

export async function loadCategories(
  refresh: RefreshLists,
  options: Omit<AttemptOptions, 'refresh'>,
): Promise<void> {
  const snapshot = captureAttempt(options.revisionCounter, options.context.type);

  await attemptWhilePending(
    () => clearErrorThen(() => refresh(snapshot.revision), options.context.error),
    options.context.pendingTasks,
    () => reportFailureIfStillRelevant(options.revisionCounter, snapshot, options.context),
  );
}

export async function attemptMutation(
  mutation: () => Promise<void>,
  options: AttemptOptions,
): Promise<void> {
  const snapshot = captureAttempt(options.revisionCounter, options.context.type);

  try {
    await runWhilePending(
      () =>
        clearErrorThen(async () => {
          await mutation();
          await options.refresh(snapshot.revision);
        }, options.context.error),
      options.context.pendingTasks,
    );
  } catch {
    await recoverFailedMutation(snapshot, options);
  }
}

export function matchesSnapshot(
  revisionCounter: RevisionCounter,
  snapshot: CategoryTypeSnapshot,
  context: ListCommandsContext,
): boolean {
  return snapshot.revision === revisionCounter.current() && context.type() === snapshot.type;
}

function captureAttempt(
  revisionCounter: RevisionCounter,
  type: () => CategoryType,
): CategoryTypeSnapshot {
  return { type: type(), revision: revisionCounter.next() };
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
  snapshot: CategoryTypeSnapshot,
  context: ListCommandsContext,
): void {
  if (matchesSnapshot(revisionCounter, snapshot, context)) {
    context.error.set('Could not load categories. Refresh and try again.');
  }
}

async function recoverFailedMutation(
  snapshot: CategoryTypeSnapshot,
  { refresh, revisionCounter, context }: AttemptOptions,
): Promise<void> {
  if (!matchesSnapshot(revisionCounter, snapshot, context)) {
    return;
  }

  context.error.set('Could not save the category. Try again.');
  await attemptWhilePending(
    () => refresh(revisionCounter.next()),
    context.pendingTasks,
    () => undefined,
  );
}
