import { inject, Injectable } from '@angular/core';
import { COLLECTIONS } from './collections';
import { DOCUMENT_STORE } from './document-store.token';
import type { Settings } from './settings';

/**
 * Settings document access: load the singleton and serialize overlapping saves.
 * Feature screens inject this — they do not call DocumentStoreService for settings.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(DOCUMENT_STORE);
  private documentId: string | null = null;
  private persistChain: Promise<void> = Promise.resolve();

  async load(): Promise<Settings | null> {
    const [doc] = await this.store.list<Settings>(COLLECTIONS.settings);
    this.documentId = doc?.id ?? null;
    return doc ? { startingYear: doc.startingYear } : null;
  }

  save(payload: Settings): Promise<void> {
    this.persistChain = this.persistChain.catch(() => undefined).then(() => this.upsert(payload));
    return this.persistChain;
  }

  private async upsert(payload: Settings): Promise<void> {
    if (this.documentId) {
      await this.store.update(COLLECTIONS.settings, this.documentId, payload);
      return;
    }
    const created = await this.store.insert(COLLECTIONS.settings, payload);
    this.documentId = created.id;
  }
}
