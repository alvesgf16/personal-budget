export interface RevisionCounter {
  next: () => number;
  isLatest: (revision: number) => boolean;
}
