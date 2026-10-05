import { inject, Injectable, signal } from '@angular/core';
import { budgetCellSchema, type BudgetCell, type EditableBudgetCell } from './budget-cell';
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
  save(cell: EditableBudgetCell): Promise<void> {
    return this.persist.enqueue(() => this.upsert(cell));
  }

  private async upsert(cell: EditableBudgetCell): Promise<void> {
    const existing = await this.findCell(cell.categoryId, cell.year, cell.month);

    if (cell.amountCents === null) {
      await this.clearExisting(existing);

      return;
    }

    await this.writeAmount(existing, {
      categoryId: cell.categoryId,
      year: cell.year,
      month: cell.month,
      amountCents: cell.amountCents,
    });
  }

  private async findCell(
    categoryId: string,
    year: number,
    month: number,
  ): Promise<StoreDocument<BudgetCell> | undefined> {
    const docs = await this.listForYear(year);

    return docs.find((doc) => doc.categoryId === categoryId && doc.month === month);
  }

  private async clearExisting(existing: StoreDocument<BudgetCell> | undefined): Promise<void> {
    if (existing) {
      await this.store.softDelete(COLLECTIONS.budgetCells, existing.id);
    }

    this.bumpRevision();
  }

  private async writeAmount(
    existing: StoreDocument<BudgetCell> | undefined,
    cell: BudgetCell,
  ): Promise<void> {
    const payload = budgetCellSchema.parse(cell);

    if (existing) {
      await this.store.update(COLLECTIONS.budgetCells, existing.id, payload);
    } else {
      await this.store.insert(COLLECTIONS.budgetCells, payload);
    }

    this.bumpRevision();
  }

  private bumpRevision(): void {
    this.revision.update((revision) => revision + 1);
  }
}
