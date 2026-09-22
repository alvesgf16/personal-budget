import 'fake-indexeddb/auto';
import { createDocumentStore, type DocumentStore } from './store';

describe('DocumentStore', () => {
  let store: DocumentStore;
  let dbName: string;

  beforeEach(() => {
    dbName = `pb-test-${crypto.randomUUID()}`;
    store = createDocumentStore(dbName);
  });

  afterEach(() => {
    store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('inserts a document with id, updatedAt, and deletedAt null', async () => {
    const doc = await store.insert('notes', { title: 'Rent' });

    expect(doc.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(doc.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(doc.deletedAt).toBeNull();
    expect(doc.title).toBe('Rent');
    expect(doc).not.toHaveProperty('collection');
  });

  it('reads an inserted document by id within its collection', async () => {
    const created = await store.insert('notes', { title: 'Groceries' });
    const found = await store.getById<{ title: string }>('notes', created.id);

    expect(found).toEqual(created);
    expect(await store.getById('other', created.id)).toBeUndefined();
  });

  it('updates payload fields and bumps updatedAt without clearing deletedAt', async () => {
    const created = await store.insert('notes', { title: 'Old' });
    const updated = await store.update<{ title: string }>('notes', created.id, {
      title: 'New',
      // Attempt to smuggle meta — must be ignored
      deletedAt: '2099-01-01T00:00:00.000Z',
      id: 'should-not-win',
    } as Partial<{ title: string }>);

    expect(updated?.title).toBe('New');
    expect(updated?.id).toBe(created.id);
    expect(updated?.deletedAt).toBeNull();
    expect(updated!.updatedAt >= created.updatedAt).toBe(true);
  });

  it('soft-deletes so list hides the row but getById still returns the tombstone', async () => {
    const a = await store.insert('notes', { title: 'Keep' });
    const b = await store.insert('notes', { title: 'Drop' });

    const ok = await store.softDelete('notes', b.id);
    expect(ok).toBe(true);

    const listed = await store.list<{ title: string }>('notes');
    expect(listed.map((d) => d.id)).toEqual([a.id]);

    const tombstone = await store.getById<{ title: string }>('notes', b.id);
    expect(tombstone?.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(tombstone?.title).toBe('Drop');
  });

  it('ignores caller meta on insert', async () => {
    const doc = await store.insert('notes', {
      title: 'X',
      id: 'caller-id',
      updatedAt: '2000-01-01T00:00:00.000Z',
      deletedAt: '2000-01-01T00:00:00.000Z',
      collection: 'hijack',
    } as { title: string });

    expect(doc.id).not.toBe('caller-id');
    expect(doc.updatedAt).not.toBe('2000-01-01T00:00:00.000Z');
    expect(doc.deletedAt).toBeNull();
    expect(await store.getById('hijack', doc.id)).toBeUndefined();
    expect(await store.getById('notes', doc.id)).toBeDefined();
  });
});
