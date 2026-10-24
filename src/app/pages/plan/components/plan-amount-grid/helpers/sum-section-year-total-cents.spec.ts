import { buildCellKey } from './build-cell-key';
import { sumSectionYearTotalCents } from './sum-section-year-total-cents';

describe('sumSectionYearTotalCents', () => {
  const salary = 'salary-id';
  const bonus = 'bonus-id';
  const hidden = 'hidden-id';
  const amounts = {
    [buildCellKey(salary, 1)]: 1_000,
    [buildCellKey(salary, 2)]: 2_000,
    [buildCellKey(salary, 12)]: 3_050,
    [buildCellKey(bonus, 1)]: 500,
    [buildCellKey(hidden, 1)]: 100_000,
  };

  it('sums active year totals for the section', () => {
    expect(
      sumSectionYearTotalCents(amounts, [
        { id: salary, type: 'income', active: true },
        { id: bonus, type: 'income', active: true },
        { id: hidden, type: 'income', active: false },
      ]),
    ).toBe(6_550);
  });
});
