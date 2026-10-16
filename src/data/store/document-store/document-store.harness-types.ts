import type { DocumentStore } from './document-store';

/** Test seam: unique IndexedDB store for specs and feature harnesses. */
export interface DocumentStoreHarness {
  store: DocumentStore;
}
