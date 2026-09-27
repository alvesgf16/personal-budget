import { z } from 'zod';

export const PLAN_YEAR_MIN = 1900;
export const PLAN_YEAR_MAX = 2100;

/** Calendar year bounds shared by settings.startingYear and budget-cell.year. */
export const planYearSchema = z.number().int().min(PLAN_YEAR_MIN).max(PLAN_YEAR_MAX);
