import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CategoryType } from '../../data/domains/category/category';
import { COLLECTIONS } from '../../data/store/types';
import type { DocumentStoreHarness } from '../../data/store/document-store/document-store.harness-types';
import { Plan } from './plan';

/** Shared seed/render helpers for Plan specs. Call after provideDocumentStoreHarness. */
export function planHarness(storeHarness: DocumentStoreHarness) {
  const seedStartingYear = (startingYear: number) =>
    storeHarness.store.insert(COLLECTIONS.settings, { startingYear });

  const renderPlan = async () => {
    const fixture = TestBed.createComponent(Plan);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  };

  const submitInSection = async (
    fixture: ComponentFixture<Plan>,
    type: CategoryType,
    name: string,
  ) => {
    const section = fixture.nativeElement.querySelector(
      `section[data-type="${type}"]`,
    ) as HTMLElement;
    const input = section.querySelector(`#category-name-${type}`) as HTMLInputElement;
    const form = section.querySelector('form') as HTMLFormElement;

    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setCell = async (fixture: ComponentFixture<Plan>, ariaLabel: string, value: string) => {
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

  const enterExpenseAndSavingsJanuary = async (fixture: ComponentFixture<Plan>) => {
    await submitInSection(fixture, 'expense', 'Rent');
    await submitInSection(fixture, 'savings', 'Emergency');
    await setCell(fixture, 'Rent January', '1200');
    await setCell(fixture, 'Emergency January', '300');
  };

  const sectionTypes = (fixture: ComponentFixture<Plan>) =>
    [...fixture.nativeElement.querySelectorAll('section[data-type]')].map((el: Element) =>
      el.getAttribute('data-type'),
    );

  const sectionHeading = (fixture: ComponentFixture<Plan>, type: CategoryType) =>
    fixture.nativeElement.querySelector(`section[data-type="${type}"] h2`)?.textContent ?? null;

  const listNames = (fixture: ComponentFixture<Plan>, type: CategoryType) =>
    [...fixture.nativeElement.querySelectorAll(`section[data-type="${type}"] li input`)].map(
      (el: Element) => (el as HTMLInputElement).value,
    );

  const inputByAriaLabel = (fixture: ComponentFixture<Plan>, ariaLabel: string) =>
    fixture.nativeElement.querySelector(
      `input[aria-label="${ariaLabel}"]`,
    ) as HTMLInputElement | null;

  const headerText = (fixture: ComponentFixture<Plan>) =>
    fixture.nativeElement.querySelector('h1')?.textContent?.trim() ?? '';

  return {
    seedStartingYear,
    renderPlan,
    submitInSection,
    setCell,
    enterExpenseAndSavingsJanuary,
    sectionTypes,
    sectionHeading,
    listNames,
    inputByAriaLabel,
    headerText,
  };
}
