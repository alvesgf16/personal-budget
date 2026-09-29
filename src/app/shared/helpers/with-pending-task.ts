import type { PendingTasks } from '@angular/core';

/** Run async work while a PendingTasks slot is open (keeps tests stable). */
export async function withPendingTask<T>(
  pendingTasks: PendingTasks,
  work: () => Promise<T>,
): Promise<T> {
  const done = pendingTasks.add();
  try {
    return await work();
  } finally {
    done();
  }
}
