import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { PLAN_YEAR_MAX, PLAN_YEAR_MIN } from '../../../data/lib/schemas/plan-year';
import { parseSettings, type Settings } from '../../../data/domains/settings/settings';
import { SettingsService } from '../../../data/domains/settings/settings.service';
import { attemptWhilePending } from '../../shared/helpers/attempt-while-pending';
import { createRevisionCounter } from '../../shared/helpers/create-revision-counter';
import { inputValueFromEvent } from '../../shared/helpers/input-value-from-event';

@Component({
  selector: 'app-settings',
  styleUrl: './settings-page.css',
  templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly revisionCounter = createRevisionCounter();

  protected readonly yearInput = signal('');
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const revision = this.revisionCounter.next();

    await attemptWhilePending(
      () => this.loadSettings(revision),
      this.pendingTasks,
      () => {
        if (revision === this.revisionCounter.current()) {
          this.error.set('Could not load the starting year. Refresh and try again.');
        }
      },
    );
  }

  private async loadSettings(revision: number): Promise<void> {
    this.error.set(null);

    const settings = await this.settingsService.get();

    if (revision !== this.revisionCounter.current()) {
      return;
    }

    if (settings) {
      this.yearInput.set(String(settings.startingYear));
    }
  }

  protected onYearInput(event: Event): void {
    this.revisionCounter.next();
    this.yearInput.set(inputValueFromEvent(event));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    const settings = parseSettings(this.yearInput());

    if (!settings) {
      this.error.set(`Enter a whole year between ${PLAN_YEAR_MIN} and ${PLAN_YEAR_MAX}.`);

      return;
    }

    const revision = this.revisionCounter.next();

    await attemptWhilePending(
      () => this.saveSettings(settings),
      this.pendingTasks,
      () => this.reportSaveFailure(revision),
    );
  }

  private async saveSettings(settings: Settings): Promise<void> {
    this.error.set(null);

    await this.settingsService.save(settings);
  }

  private reportSaveFailure(revision: number): void {
    if (revision === this.revisionCounter.current()) {
      this.error.set('Could not save the starting year. Try again.');
    }
  }
}
