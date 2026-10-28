import type { ParseSettingsInput, Settings } from '../../../../data/domains/settings/settings';
import type { SettingsFormField, SettingsFormSignals } from '../types';

/** Hydrates fields the user has not edited yet so a late load cannot wipe stored values. */
export function applyLoadedSettings(
  settings: Settings,
  fields: SettingsFormSignals,
  dirtyFields: ReadonlySet<SettingsFormField>,
): void {
  if (!dirtyFields.has('startingYear')) {
    fields.startingYearInput.set(String(settings.startingYear));
  }

  if (!dirtyFields.has('lateIncomeShift')) {
    fields.lateIncomeShift.set(settings.lateIncomeShift);
  }

  if (!dirtyFields.has('lateIncomeShiftStartingDay')) {
    fields.lateIncomeShiftStartingDay.set(String(settings.lateIncomeShiftStartingDay));
  }
}

export function settingsFormInput(fields: SettingsFormSignals): ParseSettingsInput {
  return {
    startingYear: fields.startingYearInput(),
    lateIncomeShift: fields.lateIncomeShift(),
    lateIncomeShiftStartingDay: fields.lateIncomeShiftStartingDay(),
  };
}
