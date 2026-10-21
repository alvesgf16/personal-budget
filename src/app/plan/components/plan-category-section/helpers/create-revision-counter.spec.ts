import { describe, expect, it } from 'vitest';
import { createRevisionCounter } from './create-revision-counter';

describe('createRevisionCounter', () => {
  it('next returns increasing revisions starting at 1', () => {
    const revisionCounter = createRevisionCounter();

    expect(revisionCounter.next()).toBe(1);
    expect(revisionCounter.next()).toBe(2);
    expect(revisionCounter.next()).toBe(3);
  });

  it('isLatest is true only for the most recent next value', () => {
    const revisionCounter = createRevisionCounter();
    const first = revisionCounter.next();
    const second = revisionCounter.next();

    expect(revisionCounter.isLatest(first)).toBe(false);
    expect(revisionCounter.isLatest(second)).toBe(true);
  });

  it('keeps independent counters isolated', () => {
    const counter = createRevisionCounter();
    const otherCounter = createRevisionCounter();
    const revision = counter.next();

    otherCounter.next();
    otherCounter.next();

    expect(counter.isLatest(revision)).toBe(true);
    expect(otherCounter.isLatest(revision)).toBe(false);
  });
});
