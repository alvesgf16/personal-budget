import { buildAmountsFromCells } from './build-amounts-from-cells';

describe('buildAmountsFromCells', () => {
  it('indexes cell amounts by categoryId:month', () => {
    expect(
      buildAmountsFromCells([
        { categoryId: 'rent', month: 1, amountCents: 100_000 },
        { categoryId: 'rent', month: 2, amountCents: 50 },
      ]),
    ).toEqual({ 'rent:1': 100_000, 'rent:2': 50 });
  });
});
