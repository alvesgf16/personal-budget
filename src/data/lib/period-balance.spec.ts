import { computePeriodBalance, periodKey } from './period-balance';

describe('periodKey', () => {
  it('formats year and zero-padded month', () => {
    expect(periodKey(2026, 3)).toBe('2026-03');
    expect(periodKey(2026, 12)).toBe('2026-12');
  });
});

describe('computePeriodBalance', () => {
  it('marks all-zero totals as untouched (not balanced)', () => {
    expect(computePeriodBalance({ incomeCents: 0, expenseCents: 0, savingsCents: 0 })).toEqual({
      remainingCents: 0,
      status: 'untouched',
    });
  });

  it('marks positive remaining as under', () => {
    expect(
      computePeriodBalance({ incomeCents: 100_000, expenseCents: 40_000, savingsCents: 10_000 }),
    ).toEqual({ remainingCents: 50_000, status: 'under' });
  });

  it('marks zero remaining with income as balanced', () => {
    expect(
      computePeriodBalance({ incomeCents: 100_000, expenseCents: 70_000, savingsCents: 30_000 }),
    ).toEqual({ remainingCents: 0, status: 'balanced' });
  });

  it('marks negative remaining as over', () => {
    expect(
      computePeriodBalance({ incomeCents: 100_000, expenseCents: 80_000, savingsCents: 40_000 }),
    ).toEqual({ remainingCents: -20_000, status: 'over' });
  });

  it('computes remaining as income minus expenses minus savings', () => {
    const incomeCents = 250_000;
    const expenseCents = 90_000;
    const savingsCents = 35_000;
    const result = computePeriodBalance({ incomeCents, expenseCents, savingsCents });
    expect(result.remainingCents).toBe(incomeCents - expenseCents - savingsCents);
  });
});
