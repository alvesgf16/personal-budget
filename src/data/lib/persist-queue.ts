/**
 * Serializes overlapping async writes so later work still runs after a failure.
 * Does not make work idempotent: each enqueue runs its own job. A second add
 * after a successful insert is a second write, not a deduped retry. Callers
 * gate submit with pending helpers and must not auto-retry a resolved mutate.
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
