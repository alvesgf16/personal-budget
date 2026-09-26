/**
 * Named piles (“collections”) in the document store.
 * Prefer these constants; store and service APIs only accept CollectionName.
 */
export const COLLECTIONS = {
  settings: 'settings',
  categories: 'categories',
  budgetCells: 'budgetCells',
} as const;

/** Union of known collection names — derived from COLLECTIONS. */
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
