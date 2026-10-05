import type { PendingTasks } from '@angular/core';

/**
 * Marks the app busy via PendingTasks while `work` runs, then clears that
 * mark so Angular can treat the app as stable again.
 */
export async function runWhilePending<T>(
  work: () => Promise<T>,
  pendingTasks: PendingTasks,
): Promise<T> {
  const done = pendingTasks.add();
  try {
    return await work();
  } finally {
    done();
  }
}
