import { applyLoadedSettings, settingsFormInput } from './settings-form';
import { emptyFormSignals, storedSettings } from '../settings-page.harness';

describe('applyLoadedSettings', () => {
  it('hydrates every field when none are dirty', () => {
    const fields = emptyFormSignals();

    applyLoadedSettings(storedSettings, fields, new Set());

    expect(settingsFormInput(fields)).toEqual({
      startingYear: '2026',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '20',
    });
  });

  it('keeps a dirty year and hydrates the other fields', () => {
    const fields = emptyFormSignals();
    fields.startingYearInput.set('2028');

    applyLoadedSettings(storedSettings, fields, new Set(['startingYear']));

    expect(settingsFormInput(fields)).toEqual({
      startingYear: '2028',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '20',
    });
  });

  it('keeps dirty late-income fields and hydrates the year', () => {
    const fields = emptyFormSignals();
    fields.lateIncomeShift.set('inactive');
    fields.lateIncomeShiftStartingDay.set('5');

    applyLoadedSettings(
      storedSettings,
      fields,
      new Set(['lateIncomeShift', 'lateIncomeShiftStartingDay']),
    );

    expect(settingsFormInput(fields)).toEqual({
      startingYear: '2026',
      lateIncomeShift: 'inactive',
      lateIncomeShiftStartingDay: '5',
    });
  });
});

describe('settingsFormInput', () => {
  it('reads the current signal values as parse input', () => {
    const fields = emptyFormSignals();
    fields.startingYearInput.set('2027');
    fields.lateIncomeShift.set('active');
    fields.lateIncomeShiftStartingDay.set('15');

    expect(settingsFormInput(fields)).toEqual({
      startingYear: '2027',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '15',
    });
  });
});
