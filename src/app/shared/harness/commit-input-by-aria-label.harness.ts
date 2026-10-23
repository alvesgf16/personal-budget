import type { ComponentFixture } from '@angular/core/testing';

/** Spec/harness helper: type an aria-labelled input and commit on blur. */
export async function commitInputByAriaLabel(
  fixture: ComponentFixture<unknown>,
  ariaLabel: string,
  value: string,
): Promise<void> {
  const input = fixture.nativeElement.querySelector(
    `input[aria-label="${ariaLabel}"]`,
  ) as HTMLInputElement;

  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();

  input.dispatchEvent(new Event('blur'));
  await fixture.whenStable();
  fixture.detectChanges();
}
