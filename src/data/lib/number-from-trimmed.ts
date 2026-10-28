/** Empty input becomes NaN so Zod rejects it. */
export function numberFromTrimmed(raw: string): number {
  const trimmed = raw.trim();

  return trimmed === '' ? Number.NaN : Number(trimmed);
}
