/**
 * Serializes overlapping async writes so later work still runs after a failure.
 */
export class PersistQueue {
  private chain: Promise<void> = Promise.resolve();

  enqueue<T>(work: () => Promise<T>): Promise<T> {
    const queued = this.chain.catch(() => undefined).then(work);
    this.chain = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued;
  }
}
