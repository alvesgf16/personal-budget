import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { PLAN_YEAR_MAX, PLAN_YEAR_MIN } from '../../data/lib/plan-year';
import {
  parseSettings,
  type Settings as DomainSettings,
} from '../../data/domains/settings/settings';
import { SettingsService } from '../../data/domains/settings/settings.service';
import { attemptWhilePending } from '../shared/helpers/attempt-while-pending';

/** Settings tab: persist the Plan starting year (PB-19). */
@Component({
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly settingsService = inject(SettingsService);
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

    const parsed = parseSettings(this.yearDraft());

    if (!parsed) {
      this.error.set(`Enter a whole year between ${PLAN_YEAR_MIN} and ${PLAN_YEAR_MAX}.`);

      return;
    }

    await attemptWhilePending(
      () => this.saveSettings(parsed),
      this.pendingTasks,
      () => this.error.set('Could not save the starting year. Try again.'),
    );
  }

  private async saveSettings(settings: DomainSettings): Promise<void> {
    this.error.set(null);

    await this.settingsService.save(settings);
  }

  private async load(): Promise<void> {
    await attemptWhilePending(
      () => this.loadSettings(),
      this.pendingTasks,
      () => this.error.set('Could not load the starting year. Refresh and try again.'),
    );
  }

  private async loadSettings(): Promise<void> {
    this.error.set(null);

    const settings = await this.settingsService.get();

    if (settings) {
      this.yearDraft.set(String(settings.startingYear));
    }
  }
}
