import { z } from 'zod';

export const CATEGORY_TYPES = ['income', 'expense', 'savings'] as const;

export const categoryTypeSchema = z.enum(CATEGORY_TYPES);

export type CategoryType = z.infer<typeof categoryTypeSchema>;
