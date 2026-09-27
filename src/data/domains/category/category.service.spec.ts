import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../store/types';
import { CategoryService } from './category.service';
import { provideTestDocumentStore } from '../../store/document-store/document-store.testing';

describe('CategoryService', () => {
  const testDb = provideTestDocumentStore('pb-20-category-service');
  let service: CategoryService;

  beforeEach(() => {
    service = TestBed.inject(CategoryService);
  });

  it('lists only active income categories in sortOrder', async () => {
    await testDb.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Bonus',
      sortOrder: 1,
      active: true,
    });
    await testDb.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Salary',
      sortOrder: 0,
      active: true,
    });
    await testDb.store.insert(COLLECTIONS.categories, {
      type: 'expense',
      name: 'Rent',
      sortOrder: 0,
      active: true,
    });
    await testDb.store.insert(COLLECTIONS.categories, {
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

  it('lists an added expense only under expense', async () => {
    await service.add('expense', 'Rent');

    expect((await service.listByType('expense')).map((doc) => doc.name)).toEqual(['Rent']);
    expect(await service.listByType('income')).toEqual([]);
  });

  it('rejects a blank name', async () => {
    await expect(service.add('income', '   ')).rejects.toThrow();
    expect(await testDb.store.list(COLLECTIONS.categories)).toEqual([]);
  });

  it('does not reuse sortOrder of inactive siblings', async () => {
    await testDb.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Old',
      sortOrder: 0,
      active: false,
    });

    const next = await service.add('income', 'New');
    expect(next.sortOrder).toBe(1);
  });

  it('keeps overlapping adds on distinct sortOrders', async () => {
    const originalInsert = testDb.store.insert.bind(testDb.store);
    let releaseInsert: () => void = () => undefined;
    const insertHold = new Promise<void>((resolve) => {
      releaseInsert = resolve;
    });
    let enteredInsert: () => void = () => undefined;
    const insertStarted = new Promise<void>((resolve) => {
      enteredInsert = resolve;
    });
    testDb.store.insert = async (collection, payload) => {
      enteredInsert();
      await insertHold;
      return originalInsert(collection, payload);
    };

    const first = service.add('income', 'Salary');
    await insertStarted;
    const second = service.add('income', 'Bonus');
    releaseInsert();
    const [a, b] = await Promise.all([first, second]);

    expect([a.sortOrder, b.sortOrder]).toEqual([0, 1]);
    expect([a.name, b.name]).toEqual(['Salary', 'Bonus']);
    expect(await testDb.store.list(COLLECTIONS.categories)).toHaveLength(2);
  });
});
