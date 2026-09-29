import { cellKey } from './helpers';
import { yearTotalCents } from './year-total-cents';

describe('yearTotalCents', () => {
  const salary = 'salary-id';
  const amounts = {
    [cellKey(salary, 1)]: 1_000,
    [cellKey(salary, 2)]: 2_000,
    [cellKey(salary, 12)]: 3_050,
  };

  it('sums twelve months for a category', () => {
    expect(yearTotalCents(amounts, salary)).toBe(6_050);
    expect(yearTotalCents({}, salary)).toBe(0);
  });
});
