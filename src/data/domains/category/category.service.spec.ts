import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../store/types';
import { CategoryService } from './category.service';
import {
  deferFirstStoreInsert,
  provideDocumentStoreHarness,
} from '../../store/document-store/document-store.harness';

const missingCategoryId = 'missing-id';

describe('CategoryService', () => {
  const storeHarness = provideDocumentStoreHarness('pb-20-category-service');
  let service: CategoryService;

  beforeEach(() => {
    service = TestBed.inject(CategoryService);
  });

  it('lists only active income categories in sortOrder', async () => {
    await storeHarness.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Bonus',
      sortOrder: 1,
      active: true,
    });
    await storeHarness.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Salary',
      sortOrder: 0,
      active: true,
    });
    await storeHarness.store.insert(COLLECTIONS.categories, {
      type: 'expense',
      name: 'Rent',
      sortOrder: 0,
      active: true,
    });
    await storeHarness.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Hidden',
      sortOrder: 2,
      active: false,
    });

    const listed = await service.listByType('income');

    expect(listed.map((doc) => doc.name)).toEqual(['Salary', 'Bonus']);
  });

  it('assigns sortOrder 0 and trims the first name', async () => {
    const first = await service.add('income', '  Salary  ');

    expect(first.name).toBe('Salary');
    expect(first.sortOrder).toBe(0);
    expect(first.type).toBe('income');
    expect(first.active).toBe(true);
  });

  it('assigns the next sortOrder after an existing sibling', async () => {
    await service.add('income', 'Salary');

    const second = await service.add('income', 'Bonus');

    expect(second.sortOrder).toBe(1);
  });

  it('lists an added expense only under expense', async () => {
    await service.add('expense', 'Rent');
    const expenses = await service.listByType('expense');
    const incomes = await service.listByType('income');

    expect(expenses.map((doc) => doc.name)).toEqual(['Rent']);
    expect(incomes).toEqual([]);
  });

  it('rejects a blank name', async () => {
    await expect(service.add('income', '   ')).rejects.toThrow();
    const listed = await storeHarness.store.list(COLLECTIONS.categories);

    expect(listed).toEqual([]);
  });

  it('does not reuse sortOrder of inactive siblings', async () => {
    await storeHarness.store.insert(COLLECTIONS.categories, {
      type: 'income',
      name: 'Old',
      sortOrder: 0,
      active: false,
    });

    const next = await service.add('income', 'New');

    expect(next.sortOrder).toBe(1);
  });

  it('keeps overlapping adds on distinct sortOrders', async () => {
    const { whenFirstInsertArrives, releaseFirstInsert } = deferFirstStoreInsert(storeHarness);

    const first = service.add('income', 'Salary');
    await whenFirstInsertArrives;
    const second = service.add('income', 'Bonus');
    releaseFirstInsert();
    const [salary, bonus] = await Promise.all([first, second]);
    const listed = await storeHarness.store.list(COLLECTIONS.categories);

    expect([salary.sortOrder, bonus.sortOrder]).toEqual([0, 1]);
    expect([salary.name, bonus.name]).toEqual(['Salary', 'Bonus']);
    expect(listed).toHaveLength(2);
  });

  it('renames without changing sortOrder, type, or active', async () => {
    const created = await service.add('income', 'Salary');

    const renamed = await service.rename(created.id, '  Paycheck  ');

    expect(renamed).toMatchObject({
      id: created.id,
      name: 'Paycheck',
      sortOrder: created.sortOrder,
      type: 'income',
      active: true,
    });
  });

  it('leaves budgetCells for the category untouched after rename', async () => {
    const created = await service.add('income', 'Salary');
    await storeHarness.store.insert(COLLECTIONS.budgetCells, {
      categoryId: created.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });

    await service.rename(created.id, 'Paycheck');
    const cells = await storeHarness.store.list(COLLECTIONS.budgetCells);

    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({
      categoryId: created.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
  });

  it('rejects a blank rename and does not write', async () => {
    const created = await service.add('income', 'Salary');

    await expect(service.rename(created.id, '   ')).rejects.toThrow();
    const listed = await service.listByType('income');

    expect(listed.map((doc) => doc.name)).toEqual(['Salary']);
  });

  it('rejects rename when the category id is missing', async () => {
    await expect(service.rename(missingCategoryId, 'Paycheck')).rejects.toThrow(/not found/i);
  });

  it('hides a category from listByType and lists it under listHiddenByType', async () => {
    const created = await service.add('income', 'Salary');

    const hidden = await service.hide(created.id);
    const active = await service.listByType('income');
    const inactive = await service.listHiddenByType('income');

    expect(hidden.active).toBe(false);
    expect(active.map((doc) => doc.name)).toEqual([]);
    expect(inactive.map((doc) => doc.name)).toEqual(['Salary']);
    expect(service.revision()).toBe(1);
  });

  it('leaves budgetCells untouched after hide', async () => {
    const created = await service.add('income', 'Salary');
    await storeHarness.store.insert(COLLECTIONS.budgetCells, {
      categoryId: created.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });

    await service.hide(created.id);
    const cells = await storeHarness.store.list(COLLECTIONS.budgetCells);

    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({
      categoryId: created.id,
      year: 2026,
      month: 1,
      amountCents: 100_000,
    });
  });

  it('unhides without changing sortOrder, name, or type', async () => {
    const created = await service.add('income', 'Salary');
    await service.hide(created.id);

    const restored = await service.unhide(created.id);
    const active = await service.listByType('income');
    const inactive = await service.listHiddenByType('income');

    expect(restored).toMatchObject({
      id: created.id,
      name: 'Salary',
      sortOrder: created.sortOrder,
      type: 'income',
      active: true,
    });
    expect(active.map((doc) => doc.name)).toEqual(['Salary']);
    expect(inactive).toEqual([]);
    expect(service.revision()).toBe(2);
  });

  it('rejects hide when the category id is missing', async () => {
    await expect(service.hide(missingCategoryId)).rejects.toThrow(/not found/i);
    expect(service.revision()).toBe(0);
  });

  it('rejects unhide when the category id is missing', async () => {
    await expect(service.unhide(missingCategoryId)).rejects.toThrow(/not found/i);
    expect(service.revision()).toBe(0);
  });
});
