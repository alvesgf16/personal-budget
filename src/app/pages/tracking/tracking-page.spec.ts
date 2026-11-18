import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryService } from '../../../data/domains/category/category.service';
import type { CategoryType } from '../../../data/lib/schemas/category-type';
import { provideDocumentStoreHarness } from '../../../data/store/document-store/document-store.harness';
import { TrackingPage } from './tracking-page';

describe('TrackingPage add form', () => {
  provideDocumentStoreHarness('pb-109-tracking', { imports: [TrackingPage] });

  it('shows only active Plan categories for the chosen type', async () => {
    await addCategory('income', 'Salary');
    await addCategory('expense', 'Rent');
    const fixture = await render();

    await chooseType(fixture, 'expense');

    expect(categoryLabels(fixture)).toEqual(['Rent']);
  });

  it('renders amount and details fields', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('#transaction-amount')).not.toBeNull();
    expect(root.querySelector('#transaction-details')).not.toBeNull();
  });
});

async function render() {
  const fixture = TestBed.createComponent(TrackingPage);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function addCategory(type: CategoryType, name: string) {
  return TestBed.inject(CategoryService).add(type, name);
}

async function chooseType(fixture: ComponentFixture<TrackingPage>, type: CategoryType) {
  const select = fixture.nativeElement.querySelector('#transaction-type') as HTMLSelectElement;

  select.value = type;
  select.dispatchEvent(new Event('change'));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function categoryLabels(fixture: ComponentFixture<TrackingPage>) {
  return [...fixture.nativeElement.querySelectorAll('#transaction-category option')]
    .slice(1)
    .map((option) => (option as HTMLOptionElement).textContent ?? '');
}
