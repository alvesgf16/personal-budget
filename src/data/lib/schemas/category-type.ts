import { z } from 'zod';

export const categoryTypeSchema = z.enum(['income', 'expense', 'savings']);

export type CategoryType = z.infer<typeof categoryTypeSchema>;
