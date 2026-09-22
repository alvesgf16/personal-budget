import { z } from 'zod';

/**
 * App settings payload (domain fields only).
 * The document store adds id / updatedAt / deletedAt when saving.
 */
export const settingsSchema = z.object({
  /** Calendar year that drives the Plan year header (PB-19). */
  startingYear: z.number().int().min(1900).max(2100),
});

/** Inferred TypeScript type — one source of truth with the Zod schema. */
export type Settings = z.infer<typeof settingsSchema>;
