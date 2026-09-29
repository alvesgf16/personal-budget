import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Category } from '../../../data/domains/category/category';
import { COLLECTIONS, type StoreDocument } from '../../../data/store/types';
import type { TestDocumentStore } from '../../../data/store/document-store/document-store.testing';
import { PlanAmountGrid } from './plan-amount-grid';

/** Shared insert/render helpers for PlanAmountGrid specs. Call after provideTestDocumentStore. */
export function planAmountGridHarness(testDb: TestDocumentStore) {
  const insertCategory = (
    name: string,
    extras: Partial<Pick<Category, 'active' | 'type' | 'sortOrder'>> = {},
  ) =>
    testDb.store.insert(COLLECTIONS.categories, {
      type: extras.type ?? 'income',
      name,
      sortOrder: extras.sortOrder ?? 0,
      active: extras.active ?? true,
    }) as Promise<StoreDocument<Category>>;

  const render = async (rows: StoreDocument<Category>[], year = 2026) => {
    const fixture = TestBed.createComponent(PlanAmountGrid);
    fixture.componentRef.setInput('year', year);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const outputText = (fixture: ComponentFixture<PlanAmountGrid>, ariaLabel: string) =>
    fixture.nativeElement.querySelector(`output[aria-label="${ariaLabel}"]`)?.textContent?.trim();

  return { insertCategory, render, outputText };
}
