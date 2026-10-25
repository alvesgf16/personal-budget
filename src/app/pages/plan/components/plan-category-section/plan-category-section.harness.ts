import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CategoryType } from '../../../../../data/lib/schemas/category-type';
import { commitInputByAriaLabel } from '../../../../shared/harness/commit-input-by-aria-label.harness';
import { PlanCategorySection } from './plan-category-section';

export function planCategorySectionHarness() {
  const render = async (type: CategoryType = 'income', year: number | null = null) => {
    const fixture = TestBed.createComponent(PlanCategorySection);

    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('year', year);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  };

  /** Mount and kick load without awaiting whenStable (a deferred list would hang). */
  const startSectionLoadWithoutWaiting = async (
    type: CategoryType = 'income',
    year: number | null = null,
  ) => {
    const fixture = TestBed.createComponent(PlanCategorySection);

    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('year', year);
    fixture.detectChanges();
    await Promise.resolve();

    return fixture;
  };

  const submitName = async (
    fixture: ComponentFixture<PlanCategorySection>,
    type: CategoryType,
    name: string,
  ) => {
    submitNameWithoutWaiting(fixture, type, name);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** Submit without awaiting whenStable (a deferred list would hang). */
  const submitNameWithoutWaiting = (
    fixture: ComponentFixture<PlanCategorySection>,
    type: CategoryType,
    name: string,
  ) => {
    const input = fixture.nativeElement.querySelector(`#category-name-${type}`) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit'));
  };

  const setCell = (
    fixture: ComponentFixture<PlanCategorySection>,
    ariaLabel: string,
    value: string,
  ) => commitInputByAriaLabel(fixture, ariaLabel, value);

  const renameByAriaLabel = async (
    fixture: ComponentFixture<PlanCategorySection>,
    currentName: string,
    nextName: string,
  ) => {
    const input = fixture.nativeElement.querySelector(
      `input[aria-label="Rename ${currentName}"]`,
    ) as HTMLInputElement;

    input.value = nextName;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const clickNamedButton = async (
    fixture: ComponentFixture<PlanCategorySection>,
    ariaLabel: string,
  ) => {
    const button = fixture.nativeElement.querySelector(
      `button[aria-label="${ariaLabel}"]`,
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const listItems = (fixture: ComponentFixture<PlanCategorySection>) =>
    [...fixture.nativeElement.querySelectorAll('.active-categories li input')].map(
      (el: Element) => (el as HTMLInputElement).value,
    );

  const outputText = (fixture: ComponentFixture<PlanCategorySection>, ariaLabel: string) =>
    (
      fixture.nativeElement.querySelector(`output[aria-label="${ariaLabel}"]`) as HTMLElement | null
    )?.textContent?.trim() ?? '';

  const alertText = (fixture: ComponentFixture<PlanCategorySection>) =>
    fixture.nativeElement.querySelector('[role="alert"]')?.textContent ?? null;

  const inputByAriaLabel = (fixture: ComponentFixture<PlanCategorySection>, ariaLabel: string) =>
    fixture.nativeElement.querySelector(
      `input[aria-label="${ariaLabel}"]`,
    ) as HTMLInputElement | null;

  const buttonByAriaLabel = (fixture: ComponentFixture<PlanCategorySection>, ariaLabel: string) =>
    fixture.nativeElement.querySelector(
      `button[aria-label="${ariaLabel}"]`,
    ) as HTMLButtonElement | null;

  const draftNameValue = (fixture: ComponentFixture<PlanCategorySection>, type: CategoryType) =>
    (fixture.nativeElement.querySelector(`#category-name-${type}`) as HTMLInputElement).value;

  const hiddenCategoriesText = (fixture: ComponentFixture<PlanCategorySection>) =>
    fixture.nativeElement.querySelector('.hidden-categories')?.textContent ?? null;

  return {
    render,
    startSectionLoadWithoutWaiting,
    submitName,
    submitNameWithoutWaiting,
    setCell,
    renameByAriaLabel,
    clickNamedButton,
    listItems,
    outputText,
    alertText,
    inputByAriaLabel,
    buttonByAriaLabel,
    draftNameValue,
    hiddenCategoriesText,
  };
}
