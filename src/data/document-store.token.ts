import { InjectionToken } from '@angular/core';
import { createDocumentStore, type DocumentStore } from './store';

/**
 * Root token for the plain DocumentStore.
 * Tests override this with a unique DB name; domain services inject it directly.
 */
export const DOCUMENT_STORE = new InjectionToken<DocumentStore>('DOCUMENT_STORE', {
  providedIn: 'root',
  factory: () => createDocumentStore(),
});
