import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { PLAN_YEAR_MAX, PLAN_YEAR_MIN } from '../../data/lib/plan-year';
import { parseStartingYear } from '../../data/domains/settings/settings';
import { SettingsService } from '../../data/domains/settings/settings.service';
import { runPending } from '../shared/helpers/run-pending';

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
    const parsed = parseStartingYear(this.yearDraft());
    if (!parsed) {
      this.error.set(`Enter a whole year between ${PLAN_YEAR_MIN} and ${PLAN_YEAR_MAX}.`);
      return;
    }

    await runPending(
      this.pendingTasks,
      this.error,
      'Could not save the starting year. Try again.',
      () => this.settings.save(parsed),
    );
  }

  private async load(): Promise<void> {
    await runPending(
      this.pendingTasks,
      this.error,
      'Could not load the starting year. Refresh and try again.',
      async () => {
        const doc = await this.settings.load();
        if (doc) {
          this.yearDraft.set(String(doc.startingYear));
        }
      },
    );
  }
}
