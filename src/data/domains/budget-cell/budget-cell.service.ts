import { inject, Injectable, signal } from '@angular/core';
import { budgetCellSchema, type BudgetCell } from './budget-cell';
import { COLLECTIONS, type StoreDocument } from '../../store/types';
import { DOCUMENT_STORE } from '../../store/document-store/document-store.token';
import { PersistQueue } from '../../lib/persist-queue';

/**
 * Budget-cell document access: list by plan year and upsert/clear one month cell.
 * Sparse — a missing document means “no amount entered,” not zero.
 * Feature screens inject this — they do not touch DOCUMENT_STORE or Dexie.
 */
@Injectable({ providedIn: 'root' })
export class BudgetCellService {
  private readonly store = inject(DOCUMENT_STORE);
  private readonly persist = new PersistQueue();

  /**
   * Bumps after every successful save so Plan surfaces (e.g. allocation status)
   * can reload without sharing in-memory amount maps across section grids.
   */
  readonly revision = signal(0);

  async listForYear(year: number): Promise<StoreDocument<BudgetCell>[]> {
    const docs = await this.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    return docs.filter((doc) => doc.year === year);
  }

  /**
   * Persist one cell. `amountCents === null` soft-deletes an existing document.
   * Saves are serialized so rapid tabbing cannot insert duplicate triples.
   */
  save(categoryId: string, year: number, month: number, amountCents: number | null): Promise<void> {
    return this.persist.enqueue(() => this.upsert(categoryId, year, month, amountCents));
  }

  private async upsert(
    categoryId: string,
    year: number,
    month: number,
    amountCents: number | null,
  ): Promise<void> {
    const existing = await this.findCell(categoryId, year, month);

    if (amountCents === null) {
      if (existing) {
        await this.store.softDelete(COLLECTIONS.budgetCells, existing.id);
      }
      this.revision.update((n) => n + 1);
      return;
    }

    const payload = budgetCellSchema.parse({ categoryId, year, month, amountCents });
    if (existing) {
      await this.store.update(COLLECTIONS.budgetCells, existing.id, payload);
    } else {
      await this.store.insert(COLLECTIONS.budgetCells, payload);
    }
    this.revision.update((n) => n + 1);
  }

  private async findCell(
    categoryId: string,
    year: number,
    month: number,
  ): Promise<StoreDocument<BudgetCell> | undefined> {
    const docs = await this.listForYear(year);
    return docs.find((doc) => doc.categoryId === categoryId && doc.month === month);
  }
}
