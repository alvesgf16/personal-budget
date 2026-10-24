import { buildCellKey } from './build-cell-key';

describe('buildCellKey', () => {
  it('joins category id and month', () => {
    expect(buildCellKey('salary-id', 1)).toBe('salary-id:1');
    expect(buildCellKey('rent', 12)).toBe('rent:12');
  });
});
