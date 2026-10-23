import { runWhilePending } from './run-while-pending';
import { stubPendingTasks } from '../harness/stub-pending-tasks.harness';

describe('runWhilePending', () => {
  it('returns the work result and closes the pending slot', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    const result = await runWhilePending(() => Promise.resolve('ok'), pendingTasks);
    expect(result).toBe('ok');
    expect(open()).toBe(0);
  });

  it('closes the pending slot when work throws', async () => {
    const { pendingTasks, open } = stubPendingTasks();
    await expect(
      runWhilePending(() => Promise.reject(new Error('failed')), pendingTasks),
    ).rejects.toThrow('failed');
    expect(open()).toBe(0);
  });
});
