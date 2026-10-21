import type { RevisionCounter } from '../types';

export function createRevisionCounter(): RevisionCounter {
  let latestRevision = 0;

  return {
    next: () => ++latestRevision,
    isLatest: (revision) => revision === latestRevision,
  };
}
