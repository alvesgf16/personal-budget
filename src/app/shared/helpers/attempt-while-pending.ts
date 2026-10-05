import type { PendingTasks } from '@angular/core';
import { runWhilePending } from './run-while-pending';

/**
 * Runs `work` under PendingTasks. On throw, calls `onFailure`
 * (skip the UI error there when the context has already moved on).
 */
export async function attemptWhilePending(
  work: () => Promise<void>,
  pendingTasks: PendingTasks,
  onFailure: () => void,
): Promise<void> {
  try {
    await runWhilePending(work, pendingTasks);
  } catch {
    onFailure();
  }
}
