import { inject, Injectable, signal } from '@angular/core';
import { transactionSchema, type Transaction } from './transaction';
import { COLLECTIONS, type StoreDocument } from '../../store/types';
import { DOCUMENT_STORE } from '../../store/document-store/document-store.token';
import { PersistQueue } from '../../lib/persist-queue';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly store = inject(DOCUMENT_STORE);
  private readonly persist = new PersistQueue();

  /**
   * Bumps after a successful add so Tracking surfaces in this tab can reload
   * without sharing in-memory transaction lists across components. Same-tab
   * only; other tabs are not notified (v1 has no cross-tab sync).
   */
  readonly revision = signal(0);

  list(): Promise<StoreDocument<Transaction>[]> {
    return this.store.list<Transaction>(COLLECTIONS.transactions);
  }

  getById(id: string): Promise<StoreDocument<Transaction> | undefined> {
    return this.store.getById<Transaction>(COLLECTIONS.transactions, id);
  }

  /** Each call inserts a new document; PersistQueue does not dedupe retries. */
  add(transaction: Transaction): Promise<StoreDocument<Transaction>> {
    return this.persist.enqueue(async () => {
      const payload = transactionSchema.parse(transaction);
      // TODO: Detect missing, hidden, or type-mismatched categoryId (PB-82).
      const created = await this.store.insert(COLLECTIONS.transactions, payload);

      this.revision.update((revision) => revision + 1);

      return created;
    });
  }
}
