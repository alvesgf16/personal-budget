import type { CategoryType } from '../../../../data/domains/category/category';

export interface RevisionCounter {
  next: () => number;
  current: () => number;
}

export interface TypeSnapshot {
  type: CategoryType;
  revision: number;
}
