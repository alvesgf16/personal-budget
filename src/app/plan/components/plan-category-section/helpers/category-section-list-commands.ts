import type { PendingTasks, WritableSignal } from '@angular/core';
import type { CategoryType } from '../../../../../data/domains/category/category';
import { attemptWhilePending } from '../../../../shared/helpers/attempt-while-pending';
import type { OperationGeneration } from '../types';

interface LoadCategoriesArgs {
  refresh: () => Promise<void>;
  operations: OperationGeneration;
  deps: ListCommandDeps;
}

interface AttemptMutationArgs {
  refresh: () => Promise<void>;
  mutation: () => Promise<unknown>;
  operations: OperationGeneration;
  deps: ListCommandDeps;
}

interface FailureHandlerArgs {
  type: CategoryType;
  generation: number;
  operations: OperationGeneration;
  message: string;
  deps: ListCommandDeps;
}

interface ListCommandDeps {
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
}

export async function loadCategories({
  refresh,
  operations,
  deps,
}: LoadCategoriesArgs): Promise<void> {
  const type = deps.type();
  const generation = operations.begin();

  await attemptWhilePending(
    () => clearErrorThen(refresh, deps),
    deps.pendingTasks,
    createFailureHandler({
      type,
      generation,
      operations,
      message: 'Could not load categories. Refresh and try again.',
      deps,
    }),
  );
}

export async function attemptMutation({
  refresh,
  mutation,
  operations,
  deps,
}: AttemptMutationArgs): Promise<void> {
  const type = deps.type();
  const generation = operations.begin();

  await attemptWhilePending(
    () => clearErrorThen(() => mutateThenRefresh(mutation, refresh), deps),
    deps.pendingTasks,
    createFailureHandler({
      type,
      generation,
      operations,
      message: 'Could not save the category. Try again.',
      deps,
    }),
  );
}

async function mutateThenRefresh(
  mutation: () => Promise<unknown>,
  refresh: () => Promise<void>,
): Promise<void> {
  await mutation();
  await refresh();
}

function createFailureHandler({
  type,
  generation,
  operations,
  message,
  deps,
}: FailureHandlerArgs): () => void {
  return () => {
    if (generation === operations.current() && deps.type() === type) {
      deps.error.set(message);
    }
  };
}

async function clearErrorThen(run: () => Promise<void>, deps: ListCommandDeps): Promise<void> {
  deps.error.set(null);
  await run();
}
