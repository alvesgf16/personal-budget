import { inject, Injectable } from '@angular/core';
import { budgetCellSchema, type BudgetCell } from './budget-cell';
import { COLLECTIONS } from './collections';
import type { StoreDocument } from './document';
import { DOCUMENT_STORE } from './document-store.token';

/**
 * Budget-cell document access: list by plan year and upsert/clear one month cell.
 * Sparse — a missing document means “no amount entered,” not zero.
 * Feature screens inject this — they do not call DocumentStoreService for cells.
 */
@Injectable({ providedIn: 'root' })
export class BudgetCellService {
  private readonly store = inject(DOCUMENT_STORE);
  private persistChain: Promise<void> = Promise.resolve();

  async listForYear(year: number): Promise<StoreDocument<BudgetCell>[]> {
    const docs = await this.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    return docs.filter((doc) => doc.year === year);
  }

  /**
   * Persist one cell. `amountCents === null` soft-deletes an existing document.
   * Saves are serialized so rapid tabbing cannot insert duplicate triples.
   */
  save(categoryId: string, year: number, month: number, amountCents: number | null): Promise<void> {
    this.persistChain = this.persistChain
      .catch(() => undefined)
      .then(() => this.upsert(categoryId, year, month, amountCents));
    return this.persistChain;
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
      return;
    }

    const payload = budgetCellSchema.parse({ categoryId, year, month, amountCents });
    if (existing) {
      await this.store.update(COLLECTIONS.budgetCells, existing.id, payload);
      return;
    }
    await this.store.insert(COLLECTIONS.budgetCells, payload);
  }

  private async findCell(
    categoryId: string,
    year: number,
    month: number,
  ): Promise<StoreDocument<BudgetCell> | undefined> {
    const docs = await this.store.list<BudgetCell>(COLLECTIONS.budgetCells);
    return docs.find(
      (doc) => doc.categoryId === categoryId && doc.year === year && doc.month === month,
    );
  }
}
