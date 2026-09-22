import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { COLLECTIONS } from '../../data/collections';
import { DocumentStoreService } from '../../data/document-store.service';
import type { Settings as SettingsPayload } from '../../data/settings';

/** Plan tab year header, driven by Settings (PB-19). */
@Component({
  selector: 'app-plan',
  styleUrl: './plan.css',
  templateUrl: './plan.html',
})
export class Plan implements OnInit {
  private readonly store = inject(DocumentStoreService);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly startingYear = signal<number | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      const [doc] = await this.store.list<SettingsPayload>(COLLECTIONS.settings);
      this.startingYear.set(doc?.startingYear ?? null);
    } finally {
      done();
    }
  }
}
