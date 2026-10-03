import { cellKey } from './cell-key';
import { sectionMonthTotalCents } from './section-month-total-cents';

describe('sectionMonthTotalCents', () => {
  const salary = 'salary-id';
  const bonus = 'bonus-id';
  const hidden = 'hidden-id';
  const amounts = {
    [cellKey(salary, 1)]: 1_000,
    [cellKey(salary, 2)]: 2_000,
    [cellKey(bonus, 1)]: 500,
    [cellKey(hidden, 1)]: 100_000,
  };
  const categories = [
    { id: salary, active: true },
    { id: bonus, active: true },
    { id: hidden, active: false },
  ];

  it('sums only active categories for a month', () => {
    expect(sectionMonthTotalCents(amounts, categories, 1)).toBe(1_500);
    expect(sectionMonthTotalCents(amounts, categories, 2)).toBe(2_000);
  });
});
