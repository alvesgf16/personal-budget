import { z } from 'zod';

export const LATE_INCOME_SHIFT_DEFAULT = 'inactive';

export const lateIncomeShiftSchema = z.enum(['active', 'inactive']);

export type LateIncomeShift = z.infer<typeof lateIncomeShiftSchema>;
