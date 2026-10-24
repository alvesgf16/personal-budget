export function inputValueFromEvent(event: Event): string {
  return (event.target as HTMLInputElement).value;
}
