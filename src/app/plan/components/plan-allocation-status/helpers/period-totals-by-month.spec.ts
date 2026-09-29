import { periodTotalsByMonth } from './period-totals-by-month';

describe('periodTotalsByMonth', () => {
  const salary = { id: 'salary', type: 'income' as const, active: true };
  const rent = { id: 'rent', type: 'expense' as const, active: true };
  const emergency = { id: 'emergency', type: 'savings' as const, active: true };
  const oldJob = { id: 'old-job', type: 'income' as const, active: false };

  it('returns twelve all-zero totals when there are no cells', () => {
    const totals = periodTotalsByMonth([], [salary, rent, emergency]);
    expect(totals).toHaveLength(12);
    expect(
      totals.every((t) => t.incomeCents === 0 && t.expenseCents === 0 && t.savingsCents === 0),
    ).toBe(true);
  });

  it('splits income, expense, and savings for one month', () => {
    const totals = periodTotalsByMonth(
      [
        { categoryId: 'salary', month: 1, amountCents: 100_000 },
        { categoryId: 'rent', month: 1, amountCents: 70_000 },
        { categoryId: 'emergency', month: 1, amountCents: 30_000 },
      ],
      [salary, rent, emergency],
    );

    expect(totals[0]).toEqual({
      incomeCents: 100_000,
      expenseCents: 70_000,
      savingsCents: 30_000,
    });
    expect(totals[1]).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      savingsCents: 0,
    });
  });

  it('ignores cells for inactive categories', () => {
    const totals = periodTotalsByMonth(
      [
        { categoryId: 'salary', month: 3, amountCents: 10_000 },
        { categoryId: 'old-job', month: 3, amountCents: 100_000 },
      ],
      [salary, oldJob],
    );

    expect(totals[2]).toEqual({
      incomeCents: 10_000,
      expenseCents: 0,
      savingsCents: 0,
    });
  });
});
