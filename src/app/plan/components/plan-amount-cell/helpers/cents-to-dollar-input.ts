/** Format stored cents for an input value (e.g. `250000` → `"2500"` or `"2500.50"`). */
export function centsToDollarInput(amountCents: number): string {
  const whole = Math.trunc(amountCents / 100);
  const frac = Math.abs(amountCents % 100);
  if (frac === 0) {
    return String(whole);
  }
  return `${whole}.${String(frac).padStart(2, '0')}`;
}
