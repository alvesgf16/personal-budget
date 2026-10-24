export interface RevisionCounter {
  next: () => number;
  current: () => number;
}

export function createRevisionCounter(): RevisionCounter {
  let currentRevision = 0;

  return {
    next: () => ++currentRevision,
    current: () => currentRevision,
  };
}
