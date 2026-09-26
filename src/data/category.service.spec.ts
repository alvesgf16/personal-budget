import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from './collections';
import { CategoryService } from './category.service';
import { DOCUMENT_STORE } from './document-store.token';
import { createDocumentStore, type DocumentStore } from './store';

describe('CategoryService', () => {
  let store: DocumentStore;
  let dbName: string;
  let service: CategoryService;

  beforeEach(() => {
    dbName = `pb-20-category-service-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    });
    service = TestBed.inject(CategoryService);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('lists only active income categories in sortOrder', async () => {
    await store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Bonus',
      sortOrder: 1,
      active: true,
    });
    await store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Salary',
      sortOrder: 0,
      active: true,
    });
    await store.insert(COLLECTIONS.categories, {
      type: 'expense',
      name: 'Rent',
      sortOrder: 0,
      active: true,
    });
    await store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Hidden',
      sortOrder: 2,
      active: false,
    });

    const listed = await service.listByType('income');
    expect(listed.map((doc) => doc.name)).toEqual(['Salary', 'Bonus']);
  });

  it('assigns sortOrder 0 then 1 and trims the name', async () => {
    const first = await service.add('income', '  Salary  ');
    expect(first.name).toBe('Salary');
    expect(first.sortOrder).toBe(0);
    expect(first.type).toBe('income');
    expect(first.active).toBe(true);

    const second = await service.add('income', 'Bonus');
    expect(second.sortOrder).toBe(1);
  });

  it('rejects a blank name', async () => {
    await expect(service.add('income', '   ')).rejects.toThrow();
    expect(await store.list(COLLECTIONS.categories)).toEqual([]);
  });

  it('does not reuse sortOrder of inactive siblings', async () => {
    await store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Old',
      sortOrder: 0,
      active: false,
    });

    const next = await service.add('income', 'New');
    expect(next.sortOrder).toBe(1);
  });
});
