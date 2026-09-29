import { signal, type PendingTasks } from '@angular/core';
import { runPending } from './run-pending';

function stubPendingTasks(): PendingTasks {
  return {
    add: () => () => undefined,
  } as PendingTasks;
}

describe('runPending', () => {
  it('clears error and runs work', async () => {
    const error = signal<string | null>('stale');
    let ran = false;
    await runPending(stubPendingTasks(), error, 'Could not save.', async () => {
      ran = true;
    });
    expect(ran).toBe(true);
    expect(error()).toBeNull();
  });

  it('sets failMessage when work throws', async () => {
    const error = signal<string | null>(null);
    await runPending(stubPendingTasks(), error, 'Could not save.', async () => {
      throw new Error('unavailable');
    });
    expect(error()).toBe('Could not save.');
  });

  it('skips failMessage when stillValid is false', async () => {
    const error = signal<string | null>(null);
    await runPending(
      stubPendingTasks(),
      error,
      'Could not save.',
      async () => {
        throw new Error('unavailable');
      },
      () => false,
    );
    expect(error()).toBeNull();
  });
});
