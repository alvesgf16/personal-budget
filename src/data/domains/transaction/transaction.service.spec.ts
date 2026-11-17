import { TestBed } from '@angular/core/testing';
import { TransactionService } from './transaction.service';
import type { Transaction } from './transaction';
import { COLLECTIONS } from '../../store/types';
import { provideDocumentStoreHarness } from '../../store/document-store/document-store.harness';

const paycheck: Transaction = {
  date: '2026-01-10',
  type: 'income',
  categoryId: 'cat-salary',
  amountCents: 250_000,
  details: 'January paycheck',
};

describe('TransactionService', () => {
  const storeHarness = provideDocumentStoreHarness('pb-81-transaction-service');
  let service: TransactionService;

  beforeEach(() => {
    service = TestBed.inject(TransactionService);
  });

  it('adds a transaction and reads it back by id and list', async () => {
    const created = await service.add(paycheck);
    const found = await service.getById(created.id);
    const listed = await service.list();

    expect(found).toEqual(created);
    expect(listed).toEqual([created]);
    expect(created).toMatchObject(paycheck);
  });

  it('rejects an invalid payload before persist', async () => {
    await expect(service.add({ ...paycheck, amountCents: 0 })).rejects.toThrow();

    expect(await service.list()).toEqual([]);
    expect(await storeHarness.store.list(COLLECTIONS.transactions)).toEqual([]);
  });

  it('bumps revision after a successful add', async () => {
    expect(service.revision()).toBe(0);

    await service.add(paycheck);

    expect(service.revision()).toBe(1);
  });
});
