import { amountsFromCells } from './amounts-from-cells';

describe('amountsFromCells', () => {
  it('indexes cell amounts by categoryId:month', () => {
    expect(
      amountsFromCells([
        { categoryId: 'a', month: 1, amountCents: 100_000 },
        { categoryId: 'a', month: 2, amountCents: 50 },
      ]),
    ).toEqual({ 'a:1': 100_000, 'a:2': 50 });
  });
});
