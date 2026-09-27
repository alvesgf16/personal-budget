/**
 * Serializes overlapping async writes so later work still runs after a failure.
 */
export class PersistQueue {
  private chain: Promise<void> = Promise.resolve();

  enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.chain.catch(() => undefined).then(work);
    this.chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
