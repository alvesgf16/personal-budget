import { inject, Injectable } from '@angular/core';
import { COLLECTIONS } from '../../store/types';
import { DOCUMENT_STORE } from '../../store/document-store/document-store.token';
import { PersistQueue } from '../../lib/persist-queue';
import type { Settings } from './settings';

/**
 * Settings document access: get the singleton and serialize overlapping saves.
 * Feature screens inject this — they do not touch DOCUMENT_STORE or Dexie.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(DOCUMENT_STORE);
  private readonly persist = new PersistQueue();
  private documentId: string | null = null;

  async get(): Promise<Settings | null> {
    const [settingsDoc] = await this.store.list<Settings>(COLLECTIONS.settings);
    this.documentId = settingsDoc?.id ?? null;
    return settingsDoc ? { startingYear: settingsDoc.startingYear } : null;
  }

  save(payload: Settings): Promise<void> {
    return this.persist.enqueue(() => this.upsert(payload));
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
