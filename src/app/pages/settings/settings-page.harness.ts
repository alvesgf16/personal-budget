import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Settings } from '../../../data/domains/settings/settings';
import { SettingsPage } from './settings-page';
import type { SettingsFormSignals } from './types';

interface SettingsFormValues {
  startingYear: string;
  lateIncomeShift?: string;
  lateIncomeShiftStartingDay?: string;
}

export const storedSettings: Settings = {
  startingYear: 2026,
  lateIncomeShift: 'active',
  lateIncomeShiftStartingDay: 20,
};

export function emptyFormSignals(): SettingsFormSignals {
  return {
    startingYearInput: signal(''),
    lateIncomeShift: signal('inactive'),
    lateIncomeShiftStartingDay: signal('1'),
  };
}

export function settingsHarness() {
  const renderSettings = async () => {
    const fixture = TestBed.createComponent(SettingsPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  };

  /** Mount and kick load without awaiting whenStable (a deferred list would hang). */
  const startSettingsLoadWithoutWaiting = async () => {
    const fixture = TestBed.createComponent(SettingsPage);

    fixture.detectChanges();
    await Promise.resolve();

    return fixture;
  };

  const submitSettings = async (
    fixture: ComponentFixture<SettingsPage>,
    values: SettingsFormValues,
  ) => {
    submitSettingsWithoutWaiting(fixture, values);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const submitStartingYear = async (
    fixture: ComponentFixture<SettingsPage>,
    startingYear: string,
  ) => {
    await submitSettings(fixture, { startingYear });
  };

  /** Submit without awaiting whenStable (a deferred list would hang). */
  const submitStartingYearWithoutWaiting = (
    fixture: ComponentFixture<SettingsPage>,
    startingYear: string,
  ) => {
    submitSettingsWithoutWaiting(fixture, { startingYear });
  };

  const submitSettingsWithoutWaiting = (
    fixture: ComponentFixture<SettingsPage>,
    values: SettingsFormValues,
  ) => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    setInputValue(fixture, '#starting-year', values.startingYear);

    if (values.lateIncomeShift !== undefined) {
      setSelectValue(fixture, '#late-income-shift', values.lateIncomeShift);
    }

    if (values.lateIncomeShiftStartingDay !== undefined) {
      setInputValue(fixture, '#late-income-shift-starting-day', values.lateIncomeShiftStartingDay);
    }

    form.dispatchEvent(new Event('submit'));
  };

  const startingYearInputValue = (fixture: ComponentFixture<SettingsPage>) =>
    (fixture.nativeElement.querySelector('#starting-year') as HTMLInputElement).value;

  const lateIncomeShiftValue = (fixture: ComponentFixture<SettingsPage>) =>
    (fixture.nativeElement.querySelector('#late-income-shift') as HTMLSelectElement).value;

  const lateIncomeShiftStartingDayValue = (fixture: ComponentFixture<SettingsPage>) =>
    (fixture.nativeElement.querySelector('#late-income-shift-starting-day') as HTMLInputElement)
      .value;

  const lateIncomeShiftStartingDayDisabled = (fixture: ComponentFixture<SettingsPage>) =>
    (fixture.nativeElement.querySelector('#late-income-shift-starting-day') as HTMLInputElement)
      .disabled;

  const setLateIncomeShift = (fixture: ComponentFixture<SettingsPage>, value: string) => {
    setSelectValue(fixture, '#late-income-shift', value);
  };

  const alertText = (fixture: ComponentFixture<SettingsPage>) =>
    fixture.nativeElement.querySelector('[role="alert"]')?.textContent ?? null;

  return {
    renderSettings,
    startSettingsLoadWithoutWaiting,
    submitStartingYear,
    submitSettings,
    submitStartingYearWithoutWaiting,
    startingYearInputValue,
    lateIncomeShiftValue,
    lateIncomeShiftStartingDayValue,
    lateIncomeShiftStartingDayDisabled,
    setLateIncomeShift,
    alertText,
  };
}

function setInputValue(fixture: ComponentFixture<SettingsPage>, selector: string, value: string) {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;

  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function setSelectValue(fixture: ComponentFixture<SettingsPage>, selector: string, value: string) {
  const select = fixture.nativeElement.querySelector(selector) as HTMLSelectElement;

  select.value = value;
  select.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}
