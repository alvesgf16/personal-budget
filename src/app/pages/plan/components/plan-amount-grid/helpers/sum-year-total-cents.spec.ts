import { buildCellKey } from './build-cell-key';
import { sumYearTotalCents } from './sum-year-total-cents';

describe('sumYearTotalCents', () => {
  const salary = 'salary-id';
  const amounts = {
    [buildCellKey(salary, 1)]: 1_000,
    [buildCellKey(salary, 2)]: 2_000,
    [buildCellKey(salary, 12)]: 3_050,
  };

  it('sums twelve months for a category', () => {
    expect(sumYearTotalCents(amounts, salary)).toBe(6_050);
    expect(sumYearTotalCents({}, salary)).toBe(0);
  });
});
