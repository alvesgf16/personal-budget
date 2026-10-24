import type { PendingTasks } from '@angular/core';

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
