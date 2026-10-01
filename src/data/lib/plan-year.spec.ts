import { PLAN_YEAR_MAX, PLAN_YEAR_MIN, planYearSchema } from './plan-year';

describe('planYearSchema', () => {
  it('accepts years at the inclusive bounds', () => {
    expect(planYearSchema.parse(PLAN_YEAR_MIN)).toBe(PLAN_YEAR_MIN);
    expect(planYearSchema.parse(PLAN_YEAR_MAX)).toBe(PLAN_YEAR_MAX);
  });

  it('accepts a year inside the range', () => {
    expect(planYearSchema.parse(2026)).toBe(2026);
  });

  it('rejects years outside the range', () => {
    expect(() => planYearSchema.parse(PLAN_YEAR_MIN - 1)).toThrow();
    expect(() => planYearSchema.parse(PLAN_YEAR_MAX + 1)).toThrow();
  });

  it('rejects non-integer and non-number values', () => {
    expect(() => planYearSchema.parse(2026.5)).toThrow();
    expect(() => planYearSchema.parse('2026')).toThrow();
  });
});
