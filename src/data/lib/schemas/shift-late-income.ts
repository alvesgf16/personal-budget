import { z } from 'zod';

export const shiftLateIncomeSchema = z.enum(['active', 'inactive']);

export type ShiftLateIncome = z.infer<typeof shiftLateIncomeSchema>;
