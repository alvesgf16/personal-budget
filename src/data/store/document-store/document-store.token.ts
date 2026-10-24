import { InjectionToken } from '@angular/core';
import { createDocumentStore, type DocumentStore } from './document-store';

/** Specs override with a unique DB name via provideDocumentStoreHarness. */
export const DOCUMENT_STORE = new InjectionToken<DocumentStore>('DOCUMENT_STORE', {
  providedIn: 'root',
  factory: () => createDocumentStore(),
});
