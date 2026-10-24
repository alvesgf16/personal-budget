import { attemptWhilePending } from '../../../../../shared/helpers/attempt-while-pending';
import { runWhilePending } from '../../../../../shared/helpers/run-while-pending';
import type { RevisionCounter } from '../types';
import {
  captureAttempt,
  clearErrorThen,
  matchesSnapshot,
  reportFailureIfStillRelevant,
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
  mutation: () => Promise<void>,
  options: AttemptMutationOptions,
): Promise<void> {
  const snapshot = captureAttempt(options.revisionCounter, options.context.type);

  try {
    await runMutationWhilePending(mutation, snapshot.revision, options);
  } catch {
    await recoverFailedMutation(snapshot, options);
  }
}

async function runMutationWhilePending(
  mutation: () => Promise<void>,
  revision: number,
  { refresh, context }: AttemptMutationOptions,
): Promise<void> {
  await runWhilePending(
    () =>
      clearErrorThen(async () => {
        await mutation();
        await refresh(revision);
      }, context.error),
    context.pendingTasks,
  );
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

async function recoverFailedMutation(
  snapshot: ReturnType<typeof captureAttempt>,
  { refresh, revisionCounter, context }: AttemptMutationOptions,
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
