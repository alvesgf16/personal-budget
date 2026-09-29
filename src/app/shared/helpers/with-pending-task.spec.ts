import type { PendingTasks } from '@angular/core';
import { withPendingTask } from './with-pending-task';

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

describe('withPendingTask', () => {
  it('returns the work result and closes the pending slot', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    const result = await withPendingTask(pendingTasks, async () => 'ok');
    expect(result).toBe('ok');
    expect(open()).toBe(0);
  });

  it('closes the pending slot when work throws', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    await expect(
      withPendingTask(pendingTasks, async () => {
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');
    expect(open()).toBe(0);
  });
});
