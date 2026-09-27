import {
  budgetCellSchema,
  centsToDollarInput,
  dollarsToCents,
  type BudgetCell,
} from './budget-cell';
import { COLLECTIONS } from './collections';
import { useTestStore } from './document-store.testing';

describe('dollarsToCents / centsToDollarInput', () => {
  it('parses whole dollars and two-decimal amounts', () => {
    expect(dollarsToCents('1234')).toBe(123_400);
    expect(dollarsToCents('1234.56')).toBe(123_456);
    expect(dollarsToCents('0.5')).toBe(50);
    expect(dollarsToCents('0')).toBe(0);
  });

  it('returns null for empty input', () => {
    expect(dollarsToCents('')).toBeNull();
    expect(dollarsToCents('   ')).toBeNull();
  });

  it('rejects negatives and invalid shapes', () => {
    expect(() => dollarsToCents('-1')).toThrow();
    expect(() => dollarsToCents('1.234')).toThrow();
    expect(() => dollarsToCents('abc')).toThrow();
  });

  it('formats cents back for inputs', () => {
    expect(centsToDollarInput(123_400)).toBe('1234');
    expect(centsToDollarInput(123_456)).toBe('1234.56');
    expect(centsToDollarInput(50)).toBe('0.50');
  });
});

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
  const testDb = useTestStore('pb-budget-cells-test');

  it('inserts and reads a parsed budget cell payload', async () => {
    const payload = budgetCellSchema.parse({
      categoryId: 'cat-rent',
      year: 2026,
      month: 1,
      amountCents: 120_000,
    });
    const created = await testDb.store.insert(COLLECTIONS.budgetCells, payload);
    const found = await testDb.store.getById<BudgetCell>(COLLECTIONS.budgetCells, created.id);

    expect(found).toEqual(created);
    expect(found).toMatchObject({
      categoryId: 'cat-rent',
      year: 2026,
      month: 1,
      amountCents: 120_000,
    });
  });
});
