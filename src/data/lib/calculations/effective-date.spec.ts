import { calculateEffectiveDate } from './effective-date';

const activeShiftDay20 = {
  lateIncomeShift: 'active' as const,
  lateIncomeShiftStartingDay: 20,
};

describe('calculateEffectiveDate', () => {
  it('returns the received date when late-income shift is inactive', () => {
    expect(
      calculateEffectiveDate({
        date: '2026-12-25',
        type: 'income',
        lateIncomeShift: 'inactive',
        lateIncomeShiftStartingDay: 20,
      }),
    ).toBe('2026-12-25');
  });

  it('returns the received date for non-income types', () => {
    expect(
      calculateEffectiveDate({
        date: '2026-03-25',
        type: 'expense',
        ...activeShiftDay20,
      }),
    ).toBe('2026-03-25');
    expect(
      calculateEffectiveDate({
        date: '2026-03-25',
        type: 'savings',
        ...activeShiftDay20,
      }),
    ).toBe('2026-03-25');
  });

  it('returns the received date for income before the shift day', () => {
    expect(
      calculateEffectiveDate({
        date: '2026-03-19',
        type: 'income',
        ...activeShiftDay20,
      }),
    ).toBe('2026-03-19');
  });

  it('shifts income on or after the shift day to the first of next month', () => {
    expect(
      calculateEffectiveDate({
        date: '2026-03-20',
        type: 'income',
        ...activeShiftDay20,
      }),
    ).toBe('2026-04-01');
    expect(
      calculateEffectiveDate({
        date: '2026-03-25',
        type: 'income',
        ...activeShiftDay20,
      }),
    ).toBe('2026-04-01');
  });

  it('rolls December income into January of the next year', () => {
    expect(
      calculateEffectiveDate({
        date: '2026-12-20',
        type: 'income',
        ...activeShiftDay20,
      }),
    ).toBe('2027-01-01');
  });
});
