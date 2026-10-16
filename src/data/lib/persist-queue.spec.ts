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
    const second = queue.enqueue(() => {
      order.push(2);
      return Promise.resolve('second');
    });

    releaseFirst();
    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
    expect(order).toEqual([1, 2]);
  });

  it('rejects the failed job but still runs later work', async () => {
    const queue = new PersistQueue();
    const order: string[] = [];

    const failed = queue.enqueue(() => {
      order.push('fail');
      return Promise.reject(new Error('write failed'));
    });
    const next = queue.enqueue(() => {
      order.push('next');
      return Promise.resolve('ok');
    });

    await expect(failed).rejects.toThrow('write failed');
    await expect(next).resolves.toBe('ok');
    expect(order).toEqual(['fail', 'next']);
  });
});
