import {
  Component,
  inject,
  OnInit,
  PendingTasks,
  signal,
  type WritableSignal,
} from '@angular/core';
import { parseSettings, type ParseSettingsInput } from '../../../data/domains/settings/settings';
import { SettingsService } from '../../../data/domains/settings/settings.service';
import { LATE_INCOME_SHIFT_DEFAULT } from '../../../data/lib/schemas/late-income-shift';
import {
  LATE_INCOME_SHIFT_STARTING_DAY_MAX,
  LATE_INCOME_SHIFT_STARTING_DAY_MIN,
} from '../../../data/lib/schemas/late-income-shift-starting-day';
import { createRevisionCounter } from '../../shared/helpers/create-revision-counter';
import { inputValueFromEvent } from '../../shared/helpers/input-value-from-event';
import { settingsFormInput } from './helpers/settings-form';
import { loadSettingsPage, persistSettingsPage } from './helpers/load-persist-settings';
import { settingsValidationFailure } from './helpers/settings-validation-failure';
import type { SettingsFormField } from './types';

@Component({
  selector: 'app-settings',
  styleUrl: './settings-page.css',
  templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly revisionCounter = createRevisionCounter();
  private readonly dirtyFields = new Set<SettingsFormField>();

  readonly startingYearInput = signal('');
  readonly lateIncomeShift = signal(LATE_INCOME_SHIFT_DEFAULT);
  readonly lateIncomeShiftStartingDay = signal(String(LATE_INCOME_SHIFT_STARTING_DAY_MIN));
  protected readonly dayMin = LATE_INCOME_SHIFT_STARTING_DAY_MIN;
  protected readonly dayMax = LATE_INCOME_SHIFT_STARTING_DAY_MAX;
  protected readonly formReady = signal(false);
  protected readonly invalidField = signal<SettingsFormField | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void loadSettingsPage({
      ...this.statusHandlers(),
      pendingTasks: this.pendingTasks,
      revisions: this.revisionCounter,
      fetch: () => this.settingsService.get(),
      fields: this,
      dirtyFields: this.dirtyFields,
      markReady: () => this.formReady.set(true),
    });
  }

  protected setFieldFromEvent(
    target: WritableSignal<string>,
    event: Event,
    field: SettingsFormField,
  ): void {
    this.revisionCounter.next();
    this.dirtyFields.add(field);
    target.set(inputValueFromEvent(event));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.formReady()) {
      return;
    }

    const input = settingsFormInput(this);
    const settings = parseSettings(input);

    if (!settings) {
      this.showValidationFailure(input);

      return;
    }

    await persistSettingsPage({
      ...this.statusHandlers(),
      settings,
      pendingTasks: this.pendingTasks,
      revisions: this.revisionCounter,
      save: (value) => this.settingsService.save(value),
      clearDirty: () => this.dirtyFields.clear(),
    });
  }

  private statusHandlers() {
    return {
      clear: () => {
        this.error.set(null);
        this.invalidField.set(null);
      },
      fail: (message: string) => this.error.set(message),
    };
  }

  private showValidationFailure(input: ParseSettingsInput): void {
    const failure = settingsValidationFailure(input);
    this.invalidField.set(failure.field);
    this.error.set(failure.message);
  }
}
