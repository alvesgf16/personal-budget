import { signal } from '@angular/core';
import { attemptWhilePending } from './attempt-while-pending';
import { stubPendingTasks } from '../harness/stub-pending-tasks.harness';

describe('attemptWhilePending', () => {
  it('runs work and closes the pending slot', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    let ran = false;
    await attemptWhilePending(
      () => {
        ran = true;
        return Promise.resolve();
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
      () => Promise.reject(new Error('unavailable')),
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
      () => Promise.reject(new Error('unavailable')),
      pendingTasks,
      () => {
        /* Caller chose not to set an error. */
      },
    );
    expect(error()).toBeNull();
  });
});
