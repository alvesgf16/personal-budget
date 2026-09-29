import { cellKey } from './cell-key';
import { sectionYearTotalCents } from './section-year-total-cents';

describe('sectionYearTotalCents', () => {
  const salary = 'salary-id';
  const bonus = 'bonus-id';
  const hidden = 'hidden-id';
  const amounts = {
    [cellKey(salary, 1)]: 1_000,
    [cellKey(salary, 2)]: 2_000,
    [cellKey(salary, 12)]: 3_050,
    [cellKey(bonus, 1)]: 500,
    [cellKey(hidden, 1)]: 100_000,
  };
  const rows = [
    { id: salary, active: true },
    { id: bonus, active: true },
    { id: hidden, active: false },
  ];

  it('sums active year totals for the section', () => {
    expect(sectionYearTotalCents(amounts, rows)).toBe(6_550);
  });
});
