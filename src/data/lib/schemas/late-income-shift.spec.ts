import { LATE_INCOME_SHIFT_DEFAULT, lateIncomeShiftSchema } from './late-income-shift';

describe('lateIncomeShiftSchema', () => {
  it('accepts active and inactive', () => {
    expect(lateIncomeShiftSchema.parse('active')).toBe('active');
    expect(lateIncomeShiftSchema.parse(LATE_INCOME_SHIFT_DEFAULT)).toBe('inactive');
  });

  it('rejects an unknown value', () => {
    expect(() => lateIncomeShiftSchema.parse('maybe')).toThrow();
  });
});
