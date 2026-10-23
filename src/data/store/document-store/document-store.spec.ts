import { COLLECTIONS } from '../types';
import { useDocumentStoreHarness } from './document-store.harness';

describe('DocumentStore', () => {
  const storeHarness = useDocumentStoreHarness('pb-test');

  it('inserts a document with id, updatedAt, and deletedAt null', async () => {
    const doc = await storeHarness.store.insert(COLLECTIONS.settings, { title: 'Rent' });

    expect(doc).toMatchObject({ title: 'Rent', deletedAt: null });
    expect(doc.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(doc.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(doc).not.toHaveProperty('collection');
  });

  it('reads an inserted document by id within its collection', async () => {
    const created = await storeHarness.store.insert(COLLECTIONS.settings, { title: 'Groceries' });
    const found = await storeHarness.store.getById<{ title: string }>(
      COLLECTIONS.settings,
      created.id,
    );
    const crossCollection = await storeHarness.store.getById(COLLECTIONS.categories, created.id);

    expect(found).toEqual(created);
    expect(crossCollection).toBeUndefined();
  });

  it('updates payload fields and bumps updatedAt without clearing deletedAt', async () => {
    const created = await storeHarness.store.insert(COLLECTIONS.settings, { title: 'Old' });
    const updated = await storeHarness.store.update<{ title: string }>(
      COLLECTIONS.settings,
      created.id,
      {
        title: 'New',
        // Attempt to smuggle meta — must be ignored
        deletedAt: '2099-01-01T00:00:00.000Z',
        id: 'should-not-win',
      } as Partial<{ title: string }>,
    );

    expect(updated?.title).toBe('New');
    expect(updated?.id).toBe(created.id);
    expect(updated?.deletedAt).toBeNull();
    expect(updated!.updatedAt >= created.updatedAt).toBe(true);
  });

  it('soft-deletes so list hides the row but getById still returns the tombstone', async () => {
    const kept = await storeHarness.store.insert(COLLECTIONS.settings, { title: 'Keep' });
    const dropped = await storeHarness.store.insert(COLLECTIONS.settings, { title: 'Drop' });

    const didSoftDelete = await storeHarness.store.softDelete(COLLECTIONS.settings, dropped.id);
    const listed = await storeHarness.store.list<{ title: string }>(COLLECTIONS.settings);
    const tombstone = await storeHarness.store.getById<{ title: string }>(
      COLLECTIONS.settings,
      dropped.id,
    );

    expect(didSoftDelete).toBe(true);
    expect(listed.map((doc) => doc.id)).toEqual([kept.id]);
    expect(tombstone?.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(tombstone?.title).toBe('Drop');
  });

  it('ignores caller meta on insert', async () => {
    const staleTimestamp = '2000-01-01T00:00:00.000Z';
    const doc = await storeHarness.store.insert(COLLECTIONS.settings, {
      title: 'X',
      id: 'caller-id',
      updatedAt: staleTimestamp,
      deletedAt: staleTimestamp,
      collection: 'hijack',
    } as { title: string });

    expect(doc.id).not.toBe('caller-id');
    expect(doc.updatedAt).not.toBe(staleTimestamp);
    expect(doc.deletedAt).toBeNull();
  });

  it('keeps an insert in the requested collection only', async () => {
    const doc = await storeHarness.store.insert(COLLECTIONS.settings, {
      title: 'X',
      collection: 'hijack',
    } as { title: string });
    const inCategories = await storeHarness.store.getById(COLLECTIONS.categories, doc.id);
    const inSettings = await storeHarness.store.getById(COLLECTIONS.settings, doc.id);

    expect(inCategories).toBeUndefined();
    expect(inSettings).toBeDefined();
  });
});
