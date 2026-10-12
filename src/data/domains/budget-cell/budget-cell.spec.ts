import { budgetCellSchema, type BudgetCell } from './budget-cell';
import { COLLECTIONS } from '../../store/types';
import { useDocumentStoreHarness } from '../../store/document-store/document-store.harness';

describe('budgetCellSchema', () => {
  const marchSalaryCell = {
    categoryId: 'cat-salary',
    year: 2026,
    month: 3,
    amountCents: 250_000,
  };

  it('accepts a valid budget cell', () => {
    expect(budgetCellSchema.parse(marchSalaryCell)).toEqual(marchSalaryCell);
  });

  it('accepts zero amountCents', () => {
    expect(budgetCellSchema.parse({ ...marchSalaryCell, amountCents: 0 }).amountCents).toBe(0);
  });

  it('rejects a missing required field', () => {
    expect(() => budgetCellSchema.parse({ categoryId: 'cat-1', year: 2026, month: 1 })).toThrow();
  });

  it('rejects an empty categoryId', () => {
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, categoryId: '' })).toThrow();
  });

  it('rejects month 0 and 13', () => {
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, month: 0 })).toThrow();
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, month: 13 })).toThrow();
  });

  it('rejects a non-integer amountCents', () => {
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, amountCents: 1.5 })).toThrow();
  });

  it('rejects a negative amountCents', () => {
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, amountCents: -1 })).toThrow();
  });

  it('rejects amountCents outside the safe-integer range', () => {
    expect(() =>
      budgetCellSchema.parse({ ...marchSalaryCell, amountCents: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow();
  });

  it('rejects a year outside the allowed range', () => {
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, year: 1899 })).toThrow();
    expect(() => budgetCellSchema.parse({ ...marchSalaryCell, year: 2101 })).toThrow();
  });
});

describe('budgetCells store round-trip', () => {
  const storeHarness = useDocumentStoreHarness('pb-budget-cells-test');

  it('inserts and reads a parsed budget cell payload', async () => {
    const payload = budgetCellSchema.parse({
      categoryId: 'cat-rent',
      year: 2026,
      month: 1,
      amountCents: 120_000,
    });
    const created = await storeHarness.store.insert(COLLECTIONS.budgetCells, payload);
    const found = await storeHarness.store.getById<BudgetCell>(COLLECTIONS.budgetCells, created.id);

    expect(found).toEqual(created);
    expect(found).toMatchObject({
      categoryId: 'cat-rent',
      year: 2026,
      month: 1,
      amountCents: 120_000,
    });
  });
});
