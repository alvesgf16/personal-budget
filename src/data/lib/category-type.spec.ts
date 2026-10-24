import { categoryTypeSchema } from './category-type';

describe('categoryTypeSchema', () => {
  it('accepts income, expense, and savings', () => {
    expect(categoryTypeSchema.parse('income')).toBe('income');
    expect(categoryTypeSchema.parse('expense')).toBe('expense');
    expect(categoryTypeSchema.parse('savings')).toBe('savings');
  });

  it('rejects an unknown type', () => {
    expect(() => categoryTypeSchema.parse('other')).toThrow();
  });
});
