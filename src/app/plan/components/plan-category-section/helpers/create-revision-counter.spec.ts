import { describe, expect, it } from 'vitest';
import { createRevisionCounter } from './create-revision-counter';

describe('createRevisionCounter', () => {
  it('next returns increasing revisions starting at 1', () => {
    const revisionCounter = createRevisionCounter();

    expect(revisionCounter.next()).toBe(1);
    expect(revisionCounter.next()).toBe(2);
    expect(revisionCounter.next()).toBe(3);
  });

  it('current tracks the latest next value without advancing', () => {
    const revisionCounter = createRevisionCounter();

    expect(revisionCounter.current()).toBe(0);
    expect(revisionCounter.next()).toBe(1);
    expect(revisionCounter.current()).toBe(1);
  });

  it('keeps independent counters isolated', () => {
    const counter = createRevisionCounter();
    const otherCounter = createRevisionCounter();
    const revision = counter.next();

    otherCounter.next();
    otherCounter.next();

    expect(revision).toBe(counter.current());
    expect(revision).not.toBe(otherCounter.current());
  });
});
