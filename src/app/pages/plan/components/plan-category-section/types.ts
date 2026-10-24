import type { CategoryType } from '../../../../../data/domains/category/category';

export interface RevisionCounter {
  next: () => number;
  current: () => number;
}

export interface CategoryTypeSnapshot {
  type: CategoryType;
  revision: number;
}
