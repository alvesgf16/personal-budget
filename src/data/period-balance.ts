/** Sortable calendar period key, e.g. `2026-03`. */
export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Zero-based allocation status for one plan month. */
export type PeriodBalanceStatus = 'untouched' | 'under' | 'balanced' | 'over';

export interface PeriodTotals {
  incomeCents: number;
  expenseCents: number;
  savingsCents: number;
}

export interface PeriodBalance {
  remainingCents: number;
  status: PeriodBalanceStatus;
}

/**
 * Remaining-to-allocate for a month: income − expenses − savings.
 *
 * `untouched` is remaining 0 with no inputs — not “complete.”
 * `balanced` is remaining 0 after real income (every dollar allocated).
 */
export function computePeriodBalance(totals: PeriodTotals): PeriodBalance {
  const { incomeCents, expenseCents, savingsCents } = totals;
  const remainingCents = incomeCents - expenseCents - savingsCents;

  if (incomeCents === 0 && expenseCents === 0 && savingsCents === 0) {
    return { remainingCents, status: 'untouched' };
  }
  if (remainingCents > 0) {
    return { remainingCents, status: 'under' };
  }
  if (remainingCents < 0) {
    return { remainingCents, status: 'over' };
  }
  return { remainingCents, status: 'balanced' };
}
