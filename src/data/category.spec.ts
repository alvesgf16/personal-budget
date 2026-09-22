import { categorySchema, type Category } from './category';
import { COLLECTIONS } from './collections';
import { createDocumentStore, type DocumentStore } from './store';

describe('categorySchema', () => {
  const valid = {
    type: 'income' as const,
    name: 'Salary',
    sortOrder: 0,
    active: true,
  };

  it('accepts a valid category', () => {
    expect(categorySchema.parse(valid)).toEqual(valid);
  });

  it('accepts expense and savings types', () => {
    expect(categorySchema.parse({ ...valid, type: 'expense' }).type).toBe('expense');
    expect(categorySchema.parse({ ...valid, type: 'savings' }).type).toBe('savings');
  });

  it('trims the name', () => {
    expect(categorySchema.parse({ ...valid, name: '  Rent  ' }).name).toBe('Rent');
  });

  it('rejects a missing required field', () => {
    expect(() => categorySchema.parse({ type: 'income', name: 'X', sortOrder: 0 })).toThrow();
  });

  it('rejects an unknown type', () => {
    expect(() => categorySchema.parse({ ...valid, type: 'other' })).toThrow();
  });

  it('rejects a blank or whitespace-only name', () => {
    expect(() => categorySchema.parse({ ...valid, name: '' })).toThrow();
    expect(() => categorySchema.parse({ ...valid, name: '   ' })).toThrow();
  });

  it('rejects a non-integer sortOrder', () => {
    expect(() => categorySchema.parse({ ...valid, sortOrder: 1.5 })).toThrow();
  });

  it('rejects a non-boolean active', () => {
    expect(() => categorySchema.parse({ ...valid, active: 'yes' })).toThrow();
  });
});

describe('categories store round-trip', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(() => {
    dbName = `pb-categories-test-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('inserts and reads a category document with store metadata', async () => {
    const payload = categorySchema.parse({
      type: 'expense',
      name: 'Groceries',
      sortOrder: 2,
      active: true,
    });
    const created = await store.insert(COLLECTIONS.categories, payload);
    const found = await store.getById<Category>(COLLECTIONS.categories, created.id);

    expect(found).toEqual(created);
    expect(found?.type).toBe('expense');
    expect(found?.name).toBe('Groceries');
    expect(found?.sortOrder).toBe(2);
    expect(found?.active).toBe(true);
    expect(found?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(found?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(found?.deletedAt).toBeNull();
  });
});
