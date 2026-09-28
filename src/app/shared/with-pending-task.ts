import type { PendingTasks, WritableSignal } from '@angular/core';

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

/**
 * Clears `error`, runs `work` under PendingTasks, and sets `failMessage` on throw.
 * Pass `stillValid` to skip the error when the UI context has already moved on.
 */
export async function runPending(
  pendingTasks: PendingTasks,
  error: WritableSignal<string | null>,
  failMessage: string,
  work: () => Promise<void>,
  stillValid: () => boolean = () => true,
): Promise<void> {
  try {
    await withPendingTask(pendingTasks, async () => {
      error.set(null);
      await work();
    });
  } catch {
    if (stillValid()) {
      error.set(failMessage);
    }
  }
}
