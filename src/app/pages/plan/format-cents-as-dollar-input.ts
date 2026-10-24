export function formatCentsAsDollarInput(amountCents: number): string {
  const wholeDollars = Math.trunc(amountCents / 100);
  const fractionalCents = Math.abs(amountCents % 100);

  if (fractionalCents === 0) {
    return String(wholeDollars);
  }

  return `${wholeDollars}.${String(fractionalCents).padStart(2, '0')}`;
}
