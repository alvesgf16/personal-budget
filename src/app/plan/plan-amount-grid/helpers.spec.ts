import { centsToDollarInput, dollarsToCents } from './helpers';

describe('dollarsToCents / centsToDollarInput', () => {
  it('parses whole dollars and two-decimal amounts', () => {
    expect(dollarsToCents('1234')).toBe(123_400);
    expect(dollarsToCents('1234.56')).toBe(123_456);
    expect(dollarsToCents('0.5')).toBe(50);
    expect(dollarsToCents('0')).toBe(0);
  });

  it('returns null for empty input', () => {
    expect(dollarsToCents('')).toBeNull();
    expect(dollarsToCents('   ')).toBeNull();
  });

  it('rejects negatives and invalid shapes', () => {
    expect(() => dollarsToCents('-1')).toThrow();
    expect(() => dollarsToCents('1.234')).toThrow();
    expect(() => dollarsToCents('abc')).toThrow();
  });

  it('formats cents back for inputs', () => {
    expect(centsToDollarInput(123_400)).toBe('1234');
    expect(centsToDollarInput(123_456)).toBe('1234.56');
    expect(centsToDollarInput(50)).toBe('0.50');
  });
});
