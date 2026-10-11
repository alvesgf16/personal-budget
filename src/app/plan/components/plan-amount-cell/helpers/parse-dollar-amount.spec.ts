import { parseDollarAmount } from './parse-dollar-amount';

describe('parseDollarAmount', () => {
  it('parses whole dollars and two-decimal amounts', () => {
    expect(parseDollarAmount('1234')).toEqual({ status: 'ok', amountCents: 123_400 });
    expect(parseDollarAmount('1234.56')).toEqual({ status: 'ok', amountCents: 123_456 });
    expect(parseDollarAmount('0.5')).toEqual({ status: 'ok', amountCents: 50 });
    expect(parseDollarAmount('0')).toEqual({ status: 'ok', amountCents: 0 });
  });

  it('returns empty for blank input', () => {
    expect(parseDollarAmount('')).toEqual({ status: 'empty' });
    expect(parseDollarAmount('   ')).toEqual({ status: 'empty' });
  });

  it('rejects negatives and invalid shapes', () => {
    expect(parseDollarAmount('-1')).toEqual({
      status: 'invalid',
      message: 'Enter a non-negative dollar amount.',
    });
    expect(parseDollarAmount('1.234')).toEqual({
      status: 'invalid',
      message: 'Enter a non-negative dollar amount.',
    });
    expect(parseDollarAmount('abc')).toEqual({
      status: 'invalid',
      message: 'Enter a non-negative dollar amount.',
    });
  });
});
