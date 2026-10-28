import { numberFromTrimmed } from './number-from-trimmed';

describe('numberFromTrimmed', () => {
  it('parses a trimmed whole number', () => {
    expect(numberFromTrimmed(' 20 ')).toBe(20);
  });

  it('returns NaN for empty input', () => {
    expect(numberFromTrimmed('')).toBeNaN();
    expect(numberFromTrimmed('   ')).toBeNaN();
  });
});
