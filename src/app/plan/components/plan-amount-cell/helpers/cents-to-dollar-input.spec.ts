import { centsToDollarInput } from './cents-to-dollar-input';

describe('centsToDollarInput', () => {
  it('formats cents back for inputs', () => {
    expect(centsToDollarInput(123_400)).toBe('1234');
    expect(centsToDollarInput(123_456)).toBe('1234.56');
    expect(centsToDollarInput(50)).toBe('0.50');
  });
});
