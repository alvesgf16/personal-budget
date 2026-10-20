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

  /** Mount and kick load without awaiting whenStable (a deferred list would hang). */
  const startSettingsLoadWithoutWaiting = async () => {
    const fixture = TestBed.createComponent(Settings);

    fixture.detectChanges();
    await Promise.resolve();

    return fixture;
  };

  const submitYear = async (fixture: ComponentFixture<Settings>, year: string) => {
    submitYearWithoutWaiting(fixture, year);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** Type without awaiting whenStable (a deferred list would hang). */
  const typeYearWithoutWaiting = (fixture: ComponentFixture<Settings>, year: string) => {
    const input = fixture.nativeElement.querySelector('#starting-year') as HTMLInputElement;

    input.value = year;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  /** Submit without awaiting whenStable (a deferred list would hang). */
  const submitYearWithoutWaiting = (fixture: ComponentFixture<Settings>, year: string) => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    typeYearWithoutWaiting(fixture, year);
    form.dispatchEvent(new Event('submit'));
  };

  const yearInputValue = (fixture: ComponentFixture<Settings>) =>
    (fixture.nativeElement.querySelector('#starting-year') as HTMLInputElement).value;

  const alertText = (fixture: ComponentFixture<Settings>) =>
    fixture.nativeElement.querySelector('[role="alert"]')?.textContent ?? null;

  return {
    renderSettings,
    startSettingsLoadWithoutWaiting,
    submitYear,
    typeYearWithoutWaiting,
    submitYearWithoutWaiting,
    yearInputValue,
    alertText,
  };
}
