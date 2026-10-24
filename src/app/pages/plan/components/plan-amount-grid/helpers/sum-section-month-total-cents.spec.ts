import type { CategoryRef } from '../../../category-ref';
import { buildCellKey } from './build-cell-key';
import { sumSectionMonthTotalCents } from './sum-section-month-total-cents';

describe('sumSectionMonthTotalCents', () => {
  const salary = 'salary-id';
  const bonus = 'bonus-id';
  const hidden = 'hidden-id';
  const amounts = {
    [buildCellKey(salary, 1)]: 1_000,
    [buildCellKey(salary, 2)]: 2_000,
    [buildCellKey(bonus, 1)]: 500,
    [buildCellKey(hidden, 1)]: 100_000,
  };
  const categories: CategoryRef[] = [
    { id: salary, type: 'income', active: true },
    { id: bonus, type: 'income', active: true },
    { id: hidden, type: 'income', active: false },
  ];

  it('sums only active categories for a month', () => {
    expect(sumSectionMonthTotalCents(amounts, categories, 1)).toBe(1_500);
    expect(sumSectionMonthTotalCents(amounts, categories, 2)).toBe(2_000);
  });
});
