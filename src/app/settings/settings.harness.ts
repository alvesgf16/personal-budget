import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';

/** Shared render/submit helpers for Settings specs. Call after provideDocumentStoreHarness. */
export function settingsHarness() {
  const renderSettings = async () => {
    const fixture = TestBed.createComponent(Settings);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  };

  const submitYear = async (fixture: ComponentFixture<Settings>, year: string) => {
    const input = fixture.nativeElement.querySelector('#starting-year') as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    input.value = year;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const alertText = (fixture: ComponentFixture<Settings>) =>
    fixture.nativeElement.querySelector('[role="alert"]')?.textContent ?? null;

  return { renderSettings, submitYear, alertText };
}
