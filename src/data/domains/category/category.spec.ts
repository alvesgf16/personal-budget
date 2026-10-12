import { categorySchema, parseCategoryName, type Category } from './category';
import { COLLECTIONS } from '../../store/types';
import { useDocumentStoreHarness } from '../../store/document-store/document-store.harness';

describe('categorySchema', () => {
  const activeIncomeCategory = {
    type: 'income' as const,
    name: 'Salary',
    sortOrder: 0,
    active: true,
  };

  it('accepts a valid category', () => {
    expect(categorySchema.parse(activeIncomeCategory)).toEqual(activeIncomeCategory);
  });

  it('accepts expense and savings types', () => {
    expect(categorySchema.parse({ ...activeIncomeCategory, type: 'expense' }).type).toBe('expense');
    expect(categorySchema.parse({ ...activeIncomeCategory, type: 'savings' }).type).toBe('savings');
  });

  it('trims the name', () => {
    expect(categorySchema.parse({ ...activeIncomeCategory, name: '  Rent  ' }).name).toBe('Rent');
  });

  it('rejects a missing required field', () => {
    expect(() => categorySchema.parse({ type: 'income', name: 'X', sortOrder: 0 })).toThrow();
  });

  it('rejects an unknown type', () => {
    expect(() => categorySchema.parse({ ...activeIncomeCategory, type: 'other' })).toThrow();
  });

  it('rejects a blank or whitespace-only name', () => {
    expect(() => categorySchema.parse({ ...activeIncomeCategory, name: '' })).toThrow();
    expect(() => categorySchema.parse({ ...activeIncomeCategory, name: '   ' })).toThrow();
  });

  it('rejects a non-integer sortOrder', () => {
    expect(() => categorySchema.parse({ ...activeIncomeCategory, sortOrder: 1.5 })).toThrow();
  });

  it('rejects a non-boolean active', () => {
    expect(() => categorySchema.parse({ ...activeIncomeCategory, active: 'yes' })).toThrow();
  });
});

describe('parseCategoryName', () => {
  it('trims a non-empty name', () => {
    expect(parseCategoryName('  Rent  ')).toBe('Rent');
  });

  it('returns null for blank input', () => {
    expect(parseCategoryName('')).toBeNull();
    expect(parseCategoryName('   ')).toBeNull();
  });
});

describe('categories store round-trip', () => {
  const storeHarness = useDocumentStoreHarness('pb-categories-test');

  it('inserts and reads a parsed category payload', async () => {
    const payload = categorySchema.parse({
      type: 'expense',
      name: 'Groceries',
      sortOrder: 2,
      active: true,
    });
    const created = await storeHarness.store.insert(COLLECTIONS.categories, payload);
    const found = await storeHarness.store.getById<Category>(COLLECTIONS.categories, created.id);

    expect(found).toEqual(created);
    expect(found).toMatchObject({
      type: 'expense',
      name: 'Groceries',
      sortOrder: 2,
      active: true,
    });
  });
});
