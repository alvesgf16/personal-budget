import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { settingsSchema } from '../../data/settings';
import { SettingsService } from '../../data/settings.service';

/** Settings tab: persist the Plan starting year (PB-19). */
@Component({
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);

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
      await this.settings.save(parsed.data);
    } catch {
      this.error.set('Could not save the starting year. Try again.');
    } finally {
      done();
    }
  }

  private async load(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      const doc = await this.settings.load();
      if (doc) {
        this.yearDraft.set(String(doc.startingYear));
      }
    } catch {
      this.error.set('Could not load the starting year. Refresh and try again.');
    } finally {
      done();
    }
  }
}
