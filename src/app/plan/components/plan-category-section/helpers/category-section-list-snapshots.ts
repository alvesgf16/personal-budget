import type { PendingTasks, WritableSignal } from '@angular/core';
import type { CategoryType } from '../../../../../data/domains/category/category';
import type { RevisionCounter, TypeSnapshot } from '../types';

export interface ListCommandsContext {
  pendingTasks: PendingTasks;
  type: () => CategoryType;
  error: WritableSignal<string | null>;
}

export type RefreshLists = (revision: number) => Promise<void>;

export interface FailureReportOptions {
  snapshot: TypeSnapshot;
  failMessage: string;
  context: ListCommandsContext;
}

export function captureAttempt(
  revisionCounter: RevisionCounter,
  type: () => CategoryType,
): TypeSnapshot {
  return {
    type: type(),
    revision: revisionCounter.next(),
  };
}

export async function clearErrorThen(
  run: () => Promise<void>,
  error: WritableSignal<string | null>,
): Promise<void> {
  error.set(null);
  await run();
}

export function reportFailureIfStillRelevant(
  revisionCounter: RevisionCounter,
  { snapshot, failMessage, context }: FailureReportOptions,
): void {
  if (matchesSnapshot(revisionCounter, snapshot, context)) {
    context.error.set(failMessage);
  }
}

export function matchesSnapshot(
  revisionCounter: RevisionCounter,
  snapshot: TypeSnapshot,
  context: ListCommandsContext,
): boolean {
  return snapshot.revision === revisionCounter.current() && context.type() === snapshot.type;
}
