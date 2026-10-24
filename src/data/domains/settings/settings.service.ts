import { inject, Injectable } from '@angular/core';
import { COLLECTIONS } from '../../store/types';
import { DOCUMENT_STORE } from '../../store/document-store/document-store.token';
import { PersistQueue } from '../../lib/persist-queue';
import { settingsSchema, type Settings } from './settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(DOCUMENT_STORE);
  private readonly persist = new PersistQueue();
  private documentId: string | null = null;

  /** Serialized with saves so an in-flight get cannot clobber documentId after insert. */
  get(): Promise<Settings | null> {
    return this.persist.enqueue(() => this.readSettings());
  }

  save(payload: Settings): Promise<void> {
    return this.persist.enqueue(() => this.upsert(payload));
  }

  private async readSettings(): Promise<Settings | null> {
    const [settingsDoc] = await this.store.list<Settings>(COLLECTIONS.settings);
    this.documentId = settingsDoc?.id ?? null;

    if (!settingsDoc) {
      return null;
    }

    return settingsSchema.parse(settingsDoc);
  }

  private async upsert(payload: Settings): Promise<void> {
    const validated = settingsSchema.parse(payload);

    if (this.documentId) {
      await this.store.update(COLLECTIONS.settings, this.documentId, validated);
      return;
    }

    const created = await this.store.insert(COLLECTIONS.settings, validated);
    this.documentId = created.id;
  }
}
