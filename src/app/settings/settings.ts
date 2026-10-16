import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { PLAN_YEAR_MAX, PLAN_YEAR_MIN } from '../../data/lib/plan-year';
import {
  parseSettings,
  type Settings as DomainSettings,
} from '../../data/domains/settings/settings';
import { SettingsService } from '../../data/domains/settings/settings.service';
import { attemptWhilePending } from '../shared/helpers/attempt-while-pending';

@Component({
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly yearInput = signal('');
  protected readonly error = signal<string | null>(null);
  private loadGeneration = 0;

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const generation = ++this.loadGeneration;

    await attemptWhilePending(
      () => this.loadSettings(generation),
      this.pendingTasks,
      () => {
        if (generation === this.loadGeneration) {
          this.error.set('Could not load the starting year. Refresh and try again.');
        }
      },
    );
  }

  private async loadSettings(generation: number): Promise<void> {
    this.error.set(null);

    const settings = await this.settingsService.get();

    if (generation !== this.loadGeneration) {
      return;
    }

    if (settings) {
      this.yearInput.set(String(settings.startingYear));
    }
  }

  protected onYearInput(event: Event): void {
    this.yearInput.set((event.target as HTMLInputElement).value);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    const settings = parseSettings(this.yearInput());

    if (!settings) {
      this.error.set(`Enter a whole year between ${PLAN_YEAR_MIN} and ${PLAN_YEAR_MAX}.`);

      return;
    }

    await attemptWhilePending(
      () => this.saveSettings(settings),
      this.pendingTasks,
      () => this.error.set('Could not save the starting year. Try again.'),
    );
  }

  private async saveSettings(settings: DomainSettings): Promise<void> {
    this.error.set(null);
    this.loadGeneration += 1;

    await this.settingsService.save(settings);
  }
}
