import { budgetCellSchema, type BudgetCell } from './budget-cell';
import { COLLECTIONS } from './collections';
import { createDocumentStore, type DocumentStore } from './store';

describe('budgetCellSchema', () => {
  const valid = {
    categoryId: 'cat-salary',
    year: 2026,
    month: 3,
    amountCents: 250_000,
  };

  it('accepts a valid budget cell', () => {
    expect(budgetCellSchema.parse(valid)).toEqual(valid);
  });

  it('accepts zero amountCents', () => {
    expect(budgetCellSchema.parse({ ...valid, amountCents: 0 }).amountCents).toBe(0);
  });

  it('rejects a missing required field', () => {
    expect(() => budgetCellSchema.parse({ categoryId: 'cat-1', year: 2026, month: 1 })).toThrow();
  });

  it('rejects an empty categoryId', () => {
    expect(() => budgetCellSchema.parse({ ...valid, categoryId: '' })).toThrow();
  });

  it('rejects month 0 and 13', () => {
    expect(() => budgetCellSchema.parse({ ...valid, month: 0 })).toThrow();
    expect(() => budgetCellSchema.parse({ ...valid, month: 13 })).toThrow();
  });

  it('rejects a non-integer amountCents', () => {
    expect(() => budgetCellSchema.parse({ ...valid, amountCents: 1.5 })).toThrow();
  });

  it('rejects a negative amountCents', () => {
    expect(() => budgetCellSchema.parse({ ...valid, amountCents: -1 })).toThrow();
  });

  it('rejects amountCents outside the safe-integer range', () => {
    expect(() =>
      budgetCellSchema.parse({ ...valid, amountCents: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow();
  });

  it('rejects a year outside the allowed range', () => {
    expect(() => budgetCellSchema.parse({ ...valid, year: 1899 })).toThrow();
    expect(() => budgetCellSchema.parse({ ...valid, year: 2101 })).toThrow();
  });
});

describe('budgetCells store round-trip', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(() => {
    dbName = `pb-budget-cells-test-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('inserts and reads a budget cell document with store metadata', async () => {
    const payload = budgetCellSchema.parse({
      categoryId: 'cat-rent',
      year: 2026,
      month: 1,
      amountCents: 120_000,
    });
    const created = await store.insert(COLLECTIONS.budgetCells, payload);
    const found = await store.getById<BudgetCell>(COLLECTIONS.budgetCells, created.id);

    expect(found).toEqual(created);
    expect(found?.categoryId).toBe('cat-rent');
    expect(found?.year).toBe(2026);
    expect(found?.month).toBe(1);
    expect(found?.amountCents).toBe(120_000);
    expect(found?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(found?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(found?.deletedAt).toBeNull();
  });
});
