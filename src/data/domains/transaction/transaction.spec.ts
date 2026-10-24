import { transactionSchema, type Transaction } from './transaction';
import { COLLECTIONS } from '../../store/types';
import { useDocumentStoreHarness } from '../../store/document-store/document-store.harness';

describe('transactionSchema', () => {
  const groceryPurchase = {
    date: '2026-03-15',
    type: 'expense' as const,
    categoryId: 'cat-groceries',
    amountCents: 4_250,
  };

  it('accepts a valid transaction', () => {
    expect(transactionSchema.parse(groceryPurchase)).toEqual(groceryPurchase);
  });

  it('accepts an omitted details field', () => {
    expect(transactionSchema.parse(groceryPurchase).details).toBeUndefined();
  });

  it('accepts optional details', () => {
    expect(transactionSchema.parse({ ...groceryPurchase, details: 'Weekly shop' }).details).toBe(
      'Weekly shop',
    );
  });

  it('accepts income and savings types', () => {
    expect(transactionSchema.parse({ ...groceryPurchase, type: 'income' }).type).toBe('income');
    expect(transactionSchema.parse({ ...groceryPurchase, type: 'savings' }).type).toBe('savings');
  });

  it('rejects a missing required field', () => {
    expect(() =>
      transactionSchema.parse({
        date: '2026-03-15',
        type: 'expense',
        categoryId: 'cat-1',
      }),
    ).toThrow();
  });

  it('rejects an unknown type', () => {
    expect(() => transactionSchema.parse({ ...groceryPurchase, type: 'other' })).toThrow();
  });

  it('rejects an empty categoryId', () => {
    expect(() => transactionSchema.parse({ ...groceryPurchase, categoryId: '' })).toThrow();
  });

  it('rejects a non-integer amountCents', () => {
    expect(() => transactionSchema.parse({ ...groceryPurchase, amountCents: 1.5 })).toThrow();
  });

  it('rejects a non-positive amountCents', () => {
    expect(() => transactionSchema.parse({ ...groceryPurchase, amountCents: 0 })).toThrow();
    expect(() => transactionSchema.parse({ ...groceryPurchase, amountCents: -1 })).toThrow();
  });

  it('rejects amountCents outside the safe-integer range', () => {
    expect(() =>
      transactionSchema.parse({
        ...groceryPurchase,
        amountCents: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow();
  });

  it('rejects an invalid date', () => {
    expect(() => transactionSchema.parse({ ...groceryPurchase, date: '03/15/2026' })).toThrow();
    expect(() => transactionSchema.parse({ ...groceryPurchase, date: '2026-13-01' })).toThrow();
  });
});

describe('transactions store round-trip', () => {
  const storeHarness = useDocumentStoreHarness('pb-transactions-test');

  it('inserts and reads a parsed transaction payload', async () => {
    const payload = transactionSchema.parse({
      date: '2026-01-10',
      type: 'income',
      categoryId: 'cat-salary',
      amountCents: 250_000,
      details: 'January paycheck',
    });
    const created = await storeHarness.store.insert(COLLECTIONS.transactions, payload);
    const found = await storeHarness.store.getById<Transaction>(
      COLLECTIONS.transactions,
      created.id,
    );

    expect(found).toEqual(created);
    expect(found).toMatchObject({
      date: '2026-01-10',
      type: 'income',
      categoryId: 'cat-salary',
      amountCents: 250_000,
      details: 'January paycheck',
    });
  });
});
