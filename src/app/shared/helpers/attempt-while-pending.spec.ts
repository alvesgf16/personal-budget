import type { PendingTasks } from '@angular/core';
import { signal } from '@angular/core';
import { attemptWhilePending } from './attempt-while-pending';

function stubPendingTasks(): { pendingTasks: PendingTasks; open: () => number } {
  let open = 0;
  const pendingTasks = {
    add: () => {
      open += 1;
      return () => {
        open -= 1;
      };
    },
  } as PendingTasks;
  return { pendingTasks, open: () => open };
}

describe('attemptWhilePending', () => {
  it('runs work and closes the pending slot', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    let ran = false;
    await attemptWhilePending(
      async () => {
        ran = true;
      },
      pendingTasks,
      () => {
        throw new Error('onFailure should not run');
      },
    );
    expect(ran).toBe(true);
    expect(open()).toBe(0);
  });

  it('calls onFailure and closes the pending slot when work throws', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    const error = signal<string | null>(null);
    await attemptWhilePending(
      async () => {
        throw new Error('unavailable');
      },
      pendingTasks,
      () => {
        error.set('Could not save.');
      },
    );
    expect(error()).toBe('Could not save.');
    expect(open()).toBe(0);
  });

  it('lets onFailure decide whether to report', async () => {
    const { pendingTasks } = stubPendingTasks();
    const error = signal<string | null>(null);
    await attemptWhilePending(
      async () => {
        throw new Error('unavailable');
      },
      pendingTasks,
      () => {
        /* stillValid was false — leave error alone */
      },
    );
    expect(error()).toBeNull();
  });
});
