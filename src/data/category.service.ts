import { inject, Injectable } from '@angular/core';
import { categorySchema, type Category, type CategoryType } from './category';
import { COLLECTIONS } from './collections';
import type { StoreDocument } from './document';
import { DOCUMENT_STORE } from './document-store.token';
import { PersistQueue } from './persist-queue';

/**
 * Category document access: list active rows by type and append with a stable sortOrder.
 * Feature screens inject this — they do not touch DOCUMENT_STORE or Dexie.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly store = inject(DOCUMENT_STORE);
  private readonly persist = new PersistQueue();

  async listByType(type: CategoryType): Promise<StoreDocument<Category>[]> {
    const docs = await this.store.list<Category>(COLLECTIONS.categories);
    return docs
      .filter((doc) => doc.type === type && doc.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }

  add(type: CategoryType, name: string): Promise<StoreDocument<Category>> {
    return this.persist.enqueue(() => this.create(type, name));
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
}
