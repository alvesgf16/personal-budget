import type { RevisionCounter } from '../types';

export function createRevisionCounter(): RevisionCounter {
  let currentRevision = 0;

  return {
    next: () => ++currentRevision,
    current: () => currentRevision,
  };
}
