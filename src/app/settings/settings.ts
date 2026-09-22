import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { COLLECTIONS } from '../../data/collections';
import { DocumentStoreService } from '../../data/document-store.service';
import { settingsSchema, type Settings as SettingsPayload } from '../../data/settings';

/** Settings tab: persist the Plan starting year (PB-19). */
@Component({
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly store = inject(DocumentStoreService);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly documentId = signal<string | null>(null);

  protected readonly yearDraft = signal('');
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected onYearDraft(event: Event): void {
    this.yearDraft.set((event.target as HTMLInputElement).value);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const raw = this.yearDraft().trim();
    const parsed = settingsSchema.safeParse({
      startingYear: raw === '' ? Number.NaN : Number(raw),
    });
    if (!parsed.success) {
      this.error.set('Enter a whole year between 1900 and 2100.');
      return;
    }

    const done = this.pendingTasks.add();
    try {
      this.error.set(null);
      const existingId = this.documentId();
      if (existingId) {
        await this.store.update(COLLECTIONS.settings, existingId, parsed.data);
        return;
      }

      const created = await this.store.insert(COLLECTIONS.settings, parsed.data);
      this.documentId.set(created.id);
    } finally {
      done();
    }
  }

  private async load(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      const [doc] = await this.store.list<SettingsPayload>(COLLECTIONS.settings);
      if (!doc) {
        return;
      }
      this.documentId.set(doc.id);
      this.yearDraft.set(String(doc.startingYear));
    } finally {
      done();
    }
  }
}
