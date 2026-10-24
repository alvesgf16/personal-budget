import { inject, Injectable, signal } from '@angular/core';
import { categorySchema, type Category, type CategoryType } from './category';
import { COLLECTIONS, type StoreDocument } from '../../store/types';
import { DOCUMENT_STORE } from '../../store/document-store/document-store.token';
import { PersistQueue } from '../../lib/persist-queue';

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

  async listPartitionedByType(
    type: CategoryType,
  ): Promise<{ active: StoreDocument<Category>[]; hidden: StoreDocument<Category>[] }> {
    const ofType = await this.listFiltered(type, () => true);
    return {
      active: ofType.filter((category) => category.active),
      hidden: ofType.filter((category) => !category.active),
    };
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
      const payload = categorySchema.parse({
        type,
        name,
        sortOrder: nextSortOrder(siblings),
        active: true,
      });

      return this.store.insert(COLLECTIONS.categories, payload);
    });
  }

  rename(id: string, name: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.applyRename(id, name));
  }

  /** Soft-hide: document and budgetCells remain. */
  hide(id: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.setActive(id, false));
  }

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

function nextSortOrder(siblings: readonly { sortOrder: number }[]): number {
  if (siblings.length === 0) {
    return 0;
  }

  return Math.max(...siblings.map((category) => category.sortOrder)) + 1;
}
