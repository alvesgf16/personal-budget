import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COLLECTIONS } from './collections';
import { DOCUMENT_STORE, DocumentStoreService } from './document-store.service';
import { createDocumentStore, type DocumentStore } from './store';

describe('DocumentStoreService', () => {
  let store: DocumentStore;
  let dbName: string;
  let service: DocumentStoreService;

  beforeEach(() => {
    dbName = `pb-service-test-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT_STORE, useValue: store }],
    });
    service = TestBed.inject(DocumentStoreService);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('is injectable from the root injector', () => {
    expect(service).toBeTruthy();
  });

  it('inserts and reads a document by id', async () => {
    const created = await service.insert(COLLECTIONS.settings, { title: 'Rent' });
    const found = await service.getById<{ title: string }>(COLLECTIONS.settings, created.id);

    expect(found).toEqual(created);
    expect(found?.title).toBe('Rent');
    expect(found?.deletedAt).toBeNull();
  });

  it('soft-deletes so list hides the row but getById returns the tombstone', async () => {
    const a = await service.insert(COLLECTIONS.settings, { title: 'Keep' });
    const b = await service.insert(COLLECTIONS.settings, { title: 'Drop' });

    expect(await service.softDelete(COLLECTIONS.settings, b.id)).toBe(true);

    const listed = await service.list<{ title: string }>(COLLECTIONS.settings);
    expect(listed.map((d) => d.id)).toEqual([a.id]);

    const tombstone = await service.getById<{ title: string }>(COLLECTIONS.settings, b.id);
    expect(tombstone?.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(tombstone?.title).toBe('Drop');
  });

  it('can be injected into a feature component', () => {
    @Component({
      selector: 'app-host',
      template: '',
    })
    class Host {
      readonly store = inject(DocumentStoreService);
    }

    const fixture = TestBed.createComponent(Host);
    expect(fixture.componentInstance.store).toBe(service);
  });
});
