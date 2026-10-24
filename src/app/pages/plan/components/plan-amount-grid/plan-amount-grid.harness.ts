import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Category } from '../../../../../data/domains/category/category';
import { COLLECTIONS, type StoreDocument } from '../../../../../data/store/types';
import type { DocumentStoreHarness } from '../../../../../data/store/document-store/document-store.harness-types';
import { commitInputByAriaLabel } from '../../../../shared/harness/commit-input-by-aria-label.harness';
import { PlanAmountGrid } from './plan-amount-grid';

/** Shared insert/render helpers for PlanAmountGrid specs. Call after provideDocumentStoreHarness. */
export function planAmountGridHarness(storeHarness: DocumentStoreHarness) {
  const insertCategory = (
    name: string,
    extras: Partial<Pick<Category, 'active' | 'type' | 'sortOrder'>> = {},
  ) =>
    storeHarness.store.insert(COLLECTIONS.categories, {
      type: extras.type ?? 'income',
      name,
      sortOrder: extras.sortOrder ?? 0,
      active: extras.active ?? true,
    }) as Promise<StoreDocument<Category>>;

  const insertCell = (categoryId: string, year: number, month: number, amountCents: number) =>
    storeHarness.store.insert(COLLECTIONS.budgetCells, {
      categoryId,
      year,
      month,
      amountCents,
    });

  const render = async (categories: StoreDocument<Category>[], year = 2026) => {
    const fixture = TestBed.createComponent(PlanAmountGrid);

    fixture.componentRef.setInput('year', year);
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  };

  const typeCell = (
    fixture: ComponentFixture<PlanAmountGrid>,
    ariaLabel: string,
    value: string,
  ) => {
    const input = inputByAriaLabel(fixture, ariaLabel)!;

    input.value = value;
    input.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    return input;
  };

  const commitCell = (
    fixture: ComponentFixture<PlanAmountGrid>,
    ariaLabel: string,
    value: string,
  ) => commitInputByAriaLabel(fixture, ariaLabel, value);

  const outputText = (fixture: ComponentFixture<PlanAmountGrid>, ariaLabel: string) =>
    fixture.nativeElement.querySelector(`output[aria-label="${ariaLabel}"]`)?.textContent?.trim();

  const inputByAriaLabel = (fixture: ComponentFixture<PlanAmountGrid>, ariaLabel: string) =>
    fixture.nativeElement.querySelector(
      `input[aria-label="${ariaLabel}"]`,
    ) as HTMLInputElement | null;

  /** Mount the grid and kick load without awaiting whenStable (a deferred list would hang). */
  const startGridLoadWithoutWaiting = async (
    categories: StoreDocument<Category>[],
    year: number,
  ) => {
    const fixture = TestBed.createComponent(PlanAmountGrid);

    fixture.componentRef.setInput('year', year);
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();

    await Promise.resolve();

    return fixture;
  };

  return {
    insertCategory,
    insertCell,
    render,
    typeCell,
    commitCell,
    outputText,
    inputByAriaLabel,
    startGridLoadWithoutWaiting,
  };
}
