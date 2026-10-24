import type { PeriodBalance, PeriodBalanceStatus } from '../../../../../../data/lib/period-balance';
import { formatCentsAsDollarInput } from '../../../format-cents-as-dollar-input';
import { PLAN_MONTH_LONG, PLAN_MONTH_SHORT } from '../../../plan-months';

export interface MonthAllocationView {
  month: number;
  shortLabel: string;
  longLabel: string;
  status: PeriodBalanceStatus;
  statusLabel: string;
}

export function buildMonthView(month: number, balance: PeriodBalance): MonthAllocationView {
  return {
    month,
    shortLabel: PLAN_MONTH_SHORT[month - 1],
    longLabel: PLAN_MONTH_LONG[month - 1],
    status: balance.status,
    statusLabel: formatPeriodBalance(balance),
  };
}

/** Presentation only — never re-derive under/balanced/over from remaining here. */
function formatPeriodBalance(balance: PeriodBalance): string {
  switch (balance.status) {
    case 'untouched':
      return 'Not started';
    case 'under':
      return `${formatCentsAsDollarInput(balance.remainingCents)} left`;
    case 'balanced':
      return 'Complete';
    case 'over':
      return `${formatCentsAsDollarInput(Math.abs(balance.remainingCents))} over`;
  }
}
