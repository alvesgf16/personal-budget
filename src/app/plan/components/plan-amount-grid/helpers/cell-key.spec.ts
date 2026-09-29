import { cellKey } from './cell-key';

describe('cellKey', () => {
  it('joins category id and month', () => {
    expect(cellKey('salary-id', 1)).toBe('salary-id:1');
    expect(cellKey('rent', 12)).toBe('rent:12');
  });
});
