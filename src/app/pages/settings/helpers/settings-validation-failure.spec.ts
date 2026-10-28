import { settingsValidationFailure } from './settings-validation-failure';

describe('settingsValidationFailure', () => {
  it('points at the year when the year is invalid', () => {
    const failure = settingsValidationFailure({
      startingYear: '1899',
      lateIncomeShift: 'inactive',
      lateIncomeShiftStartingDay: '1',
    });

    expect(failure.field).toBe('startingYear');
    expect(failure.message).toContain('1900');
  });

  it('points at the day when the year is valid but the day is not', () => {
    const failure = settingsValidationFailure({
      startingYear: '2026',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '32',
    });

    expect(failure.field).toBe('lateIncomeShiftStartingDay');
    expect(failure.message).toContain('1 and 31');
  });

  it('points at late-income shift when that choice is invalid', () => {
    const failure = settingsValidationFailure({
      startingYear: '2026',
      lateIncomeShift: 'maybe',
      lateIncomeShiftStartingDay: '1',
    });

    expect(failure.field).toBe('lateIncomeShift');
    expect(failure.message).toContain('Active or Inactive');
  });
});
