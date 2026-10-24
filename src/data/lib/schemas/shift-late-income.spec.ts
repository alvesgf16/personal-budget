import { shiftLateIncomeSchema } from './shift-late-income';

describe('shiftLateIncomeSchema', () => {
  it('accepts active and inactive', () => {
    expect(shiftLateIncomeSchema.parse('active')).toBe('active');
    expect(shiftLateIncomeSchema.parse('inactive')).toBe('inactive');
  });

  it('rejects an unknown value', () => {
    expect(() => shiftLateIncomeSchema.parse('maybe')).toThrow();
  });
});
