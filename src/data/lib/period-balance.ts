/** Sortable calendar period key, e.g. `2026-03`. */
export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

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
  const remainingCents = totals.incomeCents - totals.expenseCents - totals.savingsCents;

  return {
    remainingCents,
    status: isUntouched(totals) ? 'untouched' : statusFromRemaining(remainingCents),
  };
}

function isUntouched(totals: PeriodTotals): boolean {
  return totals.incomeCents === 0 && totals.expenseCents === 0 && totals.savingsCents === 0;
}

function statusFromRemaining(remainingCents: number): PeriodBalanceStatus {
  if (remainingCents > 0) {
    return 'under';
  }
  if (remainingCents < 0) {
    return 'over';
  }
  return 'balanced';
}
