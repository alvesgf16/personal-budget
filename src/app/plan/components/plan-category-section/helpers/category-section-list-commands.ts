import { attemptWhilePending } from '../../../../shared/helpers/attempt-while-pending';
import { runWhilePending } from '../../../../shared/helpers/run-while-pending';
import type { RevisionCounter } from '../types';
import {
  captureAttempt,
  clearErrorThen,
  matchesSnapshot,
  reportFailureIfStillRelevant,
  type FailureReportOptions,
  type ListCommandsContext,
  type RefreshLists,
} from './category-section-list-snapshots';

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

interface MutationFailureOptions extends FailureReportOptions {
  refresh: RefreshLists;
  revisionCounter: RevisionCounter;
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
  options: AttemptMutationOptions,
): Promise<void> {
  const snapshot = captureAttempt(options.revisionCounter, options.context.type);

  try {
    await runMutationWhilePending(mutation, snapshot.revision, options);
  } catch {
    await recoverFailedMutation({
      snapshot,
      failMessage: 'Could not save the category. Try again.',
      context: options.context,
      refresh: options.refresh,
      revisionCounter: options.revisionCounter,
    });
  }
}

async function runMutationWhilePending(
  mutation: () => Promise<unknown>,
  revision: number,
  { refresh, context }: AttemptMutationOptions,
): Promise<void> {
  await runWhilePending(
    () => clearErrorThen(() => mutateThenRefresh(mutation, () => refresh(revision)), context.error),
    context.pendingTasks,
  );
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

async function recoverFailedMutation({
  snapshot,
  failMessage,
  context,
  refresh,
  revisionCounter,
}: MutationFailureOptions): Promise<void> {
  if (!matchesSnapshot(revisionCounter, snapshot, context)) {
    return;
  }

  context.error.set(failMessage);
  await runWhilePending(() => refresh(revisionCounter.next()), context.pendingTasks);
}
