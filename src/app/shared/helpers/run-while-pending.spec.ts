import type { PendingTasks } from '@angular/core';
import { runWhilePending } from './run-while-pending';

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

describe('runWhilePending', () => {
  it('returns the work result and closes the pending slot', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    const result = await runWhilePending(async () => 'ok', pendingTasks);
    expect(result).toBe('ok');
    expect(open()).toBe(0);
  });

  it('closes the pending slot when work throws', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    await expect(
      runWhilePending(async () => {
        throw new Error('failed');
      }, pendingTasks),
    ).rejects.toThrow('failed');
    expect(open()).toBe(0);
  });
});
