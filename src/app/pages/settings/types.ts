import type { WritableSignal } from '@angular/core';

export type SettingsFormField = 'startingYear' | 'lateIncomeShift' | 'lateIncomeShiftStartingDay';

export interface SettingsFormSignals {
  startingYearInput: WritableSignal<string>;
  lateIncomeShift: WritableSignal<string>;
  lateIncomeShiftStartingDay: WritableSignal<string>;
}
