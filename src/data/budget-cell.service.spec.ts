import { TestBed } from '@angular/core/testing';
import { BudgetCellService } from './budget-cell.service';
import type { BudgetCell } from './budget-cell';
import { COLLECTIONS } from './collections';
import { DOCUMENT_STORE } from './document-store.token';
import { createDocumentStore, type DocumentStore } from './store';

describe('BudgetCellService', () => {
  let store: DocumentStore;
  let dbName: string;
  let service: BudgetCellService;

  beforeEach(() => {
    dbName = `pb-21-budget-cell-service-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    });
    service = TestBed.inject(BudgetCellService);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('upserts the same March cell twice as one document', async () => {
    await service.save('cat-salary', 2026, 3, 100_000);
    await service.save('cat-salary', 2026, 3, 250_000);

    const cells = await store.list<BudgetCell>(COLLECTIONS.budgetCells);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({
      categoryId: 'cat-salary',
      year: 2026,
      month: 3,
      amountCents: 250_000,
    });
  });

  it('saves January without creating a February cell', async () => {
    await service.save('cat-salary', 2026, 1, 500_000);

    const cells = await service.listForYear(2026);
    expect(cells).toHaveLength(1);
    expect(cells[0].month).toBe(1);
    expect(cells[0].amountCents).toBe(500_000);
  });

  it('soft-deletes when clearing a cell with null', async () => {
    await service.save('cat-salary', 2026, 1, 100_000);
    await service.save('cat-salary', 2026, 1, null);

    expect(await service.listForYear(2026)).toEqual([]);
    expect(await store.list(COLLECTIONS.budgetCells)).toEqual([]);
  });

  it('lists only cells for the requested year', async () => {
    await service.save('cat-salary', 2026, 1, 100_000);
    await service.save('cat-salary', 2027, 1, 200_000);

    const listed = await service.listForYear(2026);
    expect(listed).toHaveLength(1);
    expect(listed[0].year).toBe(2026);
  });
});
