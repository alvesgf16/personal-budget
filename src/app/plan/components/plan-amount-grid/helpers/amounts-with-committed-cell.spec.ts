import { amountsWithCommittedCell } from './amounts-with-committed-cell';

describe('amountsWithCommittedCell', () => {
  it('sets amountCents at categoryId:month without mutating the input', () => {
    const amounts = { 'rent:1': 100_000 };

    expect(
      amountsWithCommittedCell(amounts, {
        categoryId: 'rent',
        month: 2,
        amountCents: 50,
      }),
    ).toEqual({ 'rent:1': 100_000, 'rent:2': 50 });
    expect(amounts).toEqual({ 'rent:1': 100_000 });
  });

  it('removes the key when amountCents is null without mutating the input', () => {
    const amounts = { 'rent:1': 100_000, 'rent:2': 50 };

    expect(
      amountsWithCommittedCell(amounts, {
        categoryId: 'rent',
        month: 2,
        amountCents: null,
      }),
    ).toEqual({ 'rent:1': 100_000 });
    expect(amounts).toEqual({ 'rent:1': 100_000, 'rent:2': 50 });
  });
});
