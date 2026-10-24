import { buildMonthView } from './build-month-view';

describe('buildMonthView', () => {
  it('maps month labels and status copy for a balanced January', () => {
    expect(buildMonthView(1, { status: 'balanced', remainingCents: 0 })).toEqual({
      month: 1,
      shortLabel: 'Jan',
      longLabel: 'January',
      status: 'balanced',
      statusLabel: 'Complete',
    });
  });

  it('maps under status for February', () => {
    expect(buildMonthView(2, { status: 'under', remainingCents: 12_500 })).toEqual({
      month: 2,
      shortLabel: 'Feb',
      longLabel: 'February',
      status: 'under',
      statusLabel: '125 left',
    });
  });

  it('maps untouched to Not started', () => {
    expect(buildMonthView(3, { status: 'untouched', remainingCents: 0 }).statusLabel).toBe(
      'Not started',
    );
  });

  it('maps over to absolute remaining over', () => {
    expect(buildMonthView(4, { status: 'over', remainingCents: -20_000 }).statusLabel).toBe(
      '200 over',
    );
  });
});
