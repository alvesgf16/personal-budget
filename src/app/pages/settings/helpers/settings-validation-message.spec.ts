import { invalidSettingsMessage } from './settings-validation-message';

describe('invalidSettingsMessage', () => {
  it('asks for a year when the year is invalid', () => {
    expect(
      invalidSettingsMessage({
        startingYear: '1899',
        lateIncomeShift: 'inactive',
        lateIncomeShiftStartingDay: '1',
      }),
    ).toContain('1900');
  });

  it('asks for a day when the year is valid but the day is not', () => {
    expect(
      invalidSettingsMessage({
        startingYear: '2026',
        lateIncomeShift: 'active',
        lateIncomeShiftStartingDay: '32',
      }),
    ).toContain('1 and 31');
  });

  it('asks for Active or Inactive when the late-income choice is invalid', () => {
    expect(
      invalidSettingsMessage({
        startingYear: '2026',
        lateIncomeShift: 'maybe',
        lateIncomeShiftStartingDay: '1',
      }),
    ).toContain('Active or Inactive');
  });
});
