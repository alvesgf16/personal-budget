import { PersistQueue } from './persist-queue';

describe('PersistQueue', () => {
  it('runs overlapping work in enqueue order', async () => {
    const queue = new PersistQueue();
    const order: number[] = [];
    let releaseFirst: () => void = () => undefined;
    const firstHold = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = queue.enqueue(async () => {
      await firstHold;
      order.push(1);
      return 'first';
    });
    const second = queue.enqueue(async () => {
      order.push(2);
      return 'second';
    });

    releaseFirst();
    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
    expect(order).toEqual([1, 2]);
  });

  it('rejects the failed job but still runs later work', async () => {
    const queue = new PersistQueue();
    const order: string[] = [];

    const failed = queue.enqueue(async () => {
      order.push('fail');
      throw new Error('write failed');
    });
    const next = queue.enqueue(async () => {
      order.push('next');
      return 'ok';
    });

    await expect(failed).rejects.toThrow('write failed');
    await expect(next).resolves.toBe('ok');
    expect(order).toEqual(['fail', 'next']);
  });
});
