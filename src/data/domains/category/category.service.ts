import { inject, Injectable, signal } from '@angular/core';
import { categorySchema, type Category, type CategoryType } from './category';
import { COLLECTIONS, type StoreDocument } from '../../store/types';
import { DOCUMENT_STORE } from '../../store/document-store/document-store.token';
import { PersistQueue } from '../../lib/persist-queue';

/**
 * Category document access: list/add, rename, and hide/unhide (active flag).
 * Feature screens inject this — they do not touch DOCUMENT_STORE or Dexie.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly store = inject(DOCUMENT_STORE);
  private readonly persist = new PersistQueue();

  /**
   * Bumps after a successful hide/unhide so Plan surfaces (e.g. allocation status)
   * can reload without sharing in-memory category lists across components.
   */
  readonly revision = signal(0);

  async listByType(type: CategoryType): Promise<StoreDocument<Category>[]> {
    const docs = await this.store.list<Category>(COLLECTIONS.categories);
    return docs
      .filter((doc) => doc.type === type && doc.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }

  async listHiddenByType(type: CategoryType): Promise<StoreDocument<Category>[]> {
    const docs = await this.store.list<Category>(COLLECTIONS.categories);
    return docs
      .filter((doc) => doc.type === type && !doc.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }

  add(type: CategoryType, name: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.create(type, name));
  }

  /** Patch display name only — sortOrder, type, active, and budgetCells stay put. */
  rename(id: string, name: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.applyRename(id, name));
  }

  /** Soft-hide: set active false; document and budgetCells remain. */
  hide(id: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.setActive(id, false));
  }

  /** Restore a hidden category to the active grid. */
  unhide(id: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.setActive(id, true));
  }

  private async create(type: CategoryType, name: string): Promise<StoreDocument<Category>> {
    const siblings = (await this.store.list<Category>(COLLECTIONS.categories)).filter(
      (doc) => doc.type === type,
    );
    const sortOrder =
      siblings.length === 0 ? 0 : Math.max(...siblings.map((doc) => doc.sortOrder)) + 1;
    const payload = categorySchema.parse({ type, name, sortOrder, active: true });
    return this.store.insert(COLLECTIONS.categories, payload);
  }

  private async applyRename(id: string, name: string): Promise<StoreDocument<Category>> {
    const trimmed = categorySchema.shape.name.parse(name);
    const existing = await this.store.getById<Category>(COLLECTIONS.categories, id);
    if (!existing) {
      throw new Error(`Category not found: ${id}`);
    }
    const updated = await this.store.update<Category>(COLLECTIONS.categories, id, {
      name: trimmed,
    });
    if (!updated) {
      throw new Error(`Category not found: ${id}`);
    }
    return updated;
  }

  private async setActive(id: string, active: boolean): Promise<StoreDocument<Category>> {
    const existing = await this.store.getById<Category>(COLLECTIONS.categories, id);
    if (!existing) {
      throw new Error(`Category not found: ${id}`);
    }
    const updated = await this.store.update<Category>(COLLECTIONS.categories, id, { active });
    if (!updated) {
      throw new Error(`Category not found: ${id}`);
    }
    this.revision.update((n) => n + 1);
    return updated;
  }
}
