import {
  Component,
  inject,
  OnInit,
  PendingTasks,
  signal,
  type WritableSignal,
} from '@angular/core';
import {
  parseSettings,
  type ParseSettingsInput,
  type Settings,
} from '../../../data/domains/settings/settings';
import { SettingsService } from '../../../data/domains/settings/settings.service';
import { LATE_INCOME_SHIFT_DEFAULT } from '../../../data/lib/schemas/late-income-shift';
import {
  LATE_INCOME_SHIFT_STARTING_DAY_MAX,
  LATE_INCOME_SHIFT_STARTING_DAY_MIN,
} from '../../../data/lib/schemas/late-income-shift-starting-day';
import { attemptWhilePending } from '../../shared/helpers/attempt-while-pending';
import { createRevisionCounter } from '../../shared/helpers/create-revision-counter';
import { inputValueFromEvent } from '../../shared/helpers/input-value-from-event';
import { invalidSettingsMessage } from './helpers/settings-validation-message';

@Component({
  selector: 'app-settings',
  styleUrl: './settings-page.css',
  templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly revisionCounter = createRevisionCounter();

  protected readonly startingYearInput = signal('');
  protected readonly lateIncomeShift = signal(LATE_INCOME_SHIFT_DEFAULT);
  protected readonly lateIncomeShiftStartingDay = signal(
    String(LATE_INCOME_SHIFT_STARTING_DAY_MIN),
  );
  protected readonly lateIncomeShiftStartingDayMin = LATE_INCOME_SHIFT_STARTING_DAY_MIN;
  protected readonly lateIncomeShiftStartingDayMax = LATE_INCOME_SHIFT_STARTING_DAY_MAX;
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected setFieldFromEvent(target: WritableSignal<string>, event: Event): void {
    this.revisionCounter.next();
    target.set(inputValueFromEvent(event));
  }

  private async load(): Promise<void> {
    const revision = this.revisionCounter.next();

    await attemptWhilePending(
      () => this.loadSettings(revision),
      this.pendingTasks,
      () => this.reportIfCurrent(revision, 'Could not load settings. Refresh and try again.'),
    );
  }

  private async loadSettings(revision: number): Promise<void> {
    this.error.set(null);

    const settings = await this.settingsService.get();

    if (revision !== this.revisionCounter.current() || !settings) {
      return;
    }

    this.applySettings(settings);
  }

  private applySettings(settings: Settings): void {
    this.startingYearInput.set(String(settings.startingYear));
    this.lateIncomeShift.set(settings.lateIncomeShift);
    this.lateIncomeShiftStartingDay.set(String(settings.lateIncomeShiftStartingDay));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    const input = this.formInput();
    const settings = parseSettings(input);

    if (!settings) {
      this.error.set(invalidSettingsMessage(input));

      return;
    }

    const revision = this.revisionCounter.next();

    await attemptWhilePending(
      () => this.saveSettings(settings),
      this.pendingTasks,
      () => this.reportIfCurrent(revision, 'Could not save settings. Try again.'),
    );
  }

  private formInput(): ParseSettingsInput {
    return {
      startingYear: this.startingYearInput(),
      lateIncomeShift: this.lateIncomeShift(),
      lateIncomeShiftStartingDay: this.lateIncomeShiftStartingDay(),
    };
  }

  private async saveSettings(settings: Settings): Promise<void> {
    this.error.set(null);

    await this.settingsService.save(settings);
  }

  private reportIfCurrent(revision: number, message: string): void {
    if (revision === this.revisionCounter.current()) {
      this.error.set(message);
    }
  }
}
