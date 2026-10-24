import { formatCentsAsDollarInput } from './format-cents-as-dollar-input';

describe('formatCentsAsDollarInput', () => {
  it('formats cents back for inputs', () => {
    expect(formatCentsAsDollarInput(123_400)).toBe('1234');
    expect(formatCentsAsDollarInput(123_456)).toBe('1234.56');
    expect(formatCentsAsDollarInput(50)).toBe('0.50');
  });
});
