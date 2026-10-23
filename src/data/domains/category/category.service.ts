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

  listByType(type: CategoryType): Promise<StoreDocument<Category>[]> {
    return this.listFiltered(type, (category) => category.active);
  }

  listHiddenByType(type: CategoryType): Promise<StoreDocument<Category>[]> {
    return this.listFiltered(type, (category) => !category.active);
  }

  private async listFiltered(
    type: CategoryType,
    isIncluded: (category: StoreDocument<Category>) => boolean,
  ): Promise<StoreDocument<Category>[]> {
    const categories = await this.store.list<Category>(COLLECTIONS.categories);
    return categories
      .filter((category) => category.type === type && isIncluded(category))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  }

  add(type: CategoryType, name: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(async () => {
      const siblings = (await this.store.list<Category>(COLLECTIONS.categories)).filter(
        (category) => category.type === type,
      );
      const sortOrder =
        siblings.length === 0 ? 0 : Math.max(...siblings.map((category) => category.sortOrder)) + 1;
      const payload = categorySchema.parse({ type, name, sortOrder, active: true });
      return this.store.insert(COLLECTIONS.categories, payload);
    });
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

  private async applyRename(id: string, name: string): Promise<StoreDocument<Category>> {
    const trimmed = categorySchema.shape.name.parse(name);
    return this.patchCategory(id, { name: trimmed });
  }

  private async setActive(id: string, active: boolean): Promise<StoreDocument<Category>> {
    const updated = await this.patchCategory(id, { active });
    this.revision.update((revision) => revision + 1);
    return updated;
  }

  private async patchCategory(
    id: string,
    patch: Partial<Category>,
  ): Promise<StoreDocument<Category>> {
    const existing = await this.store.getById<Category>(COLLECTIONS.categories, id);
    if (!existing) {
      throw new Error(`Category not found: ${id}`);
    }
    const updated = await this.store.update<Category>(COLLECTIONS.categories, id, patch);
    if (!updated) {
      throw new Error(`Category not found: ${id}`);
    }
    return updated;
  }
}
