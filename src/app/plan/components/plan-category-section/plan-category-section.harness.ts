import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CategoryType } from '../../../../data/domains/category/category';
import { PlanCategorySection } from './plan-category-section';

/** Shared render/DOM helpers for PlanCategorySection specs. Call after provideDocumentStoreHarness. */
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

  const submitName = async (
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
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setCell = async (
    fixture: ComponentFixture<PlanCategorySection>,
    ariaLabel: string,
    value: string,
  ) => {
    const input = fixture.nativeElement.querySelector(
      `input[aria-label="${ariaLabel}"]`,
    ) as HTMLInputElement;

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

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
    submitName,
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
