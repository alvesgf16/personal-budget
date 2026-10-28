import {
  LATE_INCOME_SHIFT_STARTING_DAY_MAX,
  LATE_INCOME_SHIFT_STARTING_DAY_MIN,
  lateIncomeShiftStartingDaySchema,
} from './late-income-shift-starting-day';

describe('lateIncomeShiftStartingDaySchema', () => {
  it('accepts days in 1–31', () => {
    expect(lateIncomeShiftStartingDaySchema.parse(LATE_INCOME_SHIFT_STARTING_DAY_MIN)).toBe(1);
    expect(lateIncomeShiftStartingDaySchema.parse(15)).toBe(15);
    expect(lateIncomeShiftStartingDaySchema.parse(LATE_INCOME_SHIFT_STARTING_DAY_MAX)).toBe(31);
  });

  it('rejects a day outside 1–31', () => {
    expect(() => lateIncomeShiftStartingDaySchema.parse(0)).toThrow();
    expect(() => lateIncomeShiftStartingDaySchema.parse(32)).toThrow();
  });

  it('rejects a fractional day', () => {
    expect(() => lateIncomeShiftStartingDaySchema.parse(15.5)).toThrow();
  });
});
