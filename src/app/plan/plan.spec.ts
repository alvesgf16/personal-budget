import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COLLECTIONS } from '../../data/store/types';
import { provideTestDocumentStore } from '../../data/store/document-store/document-store.testing';
import { Plan } from './plan';

describe('Plan year header', () => {
  const testDb = provideTestDocumentStore('pb-19-plan', { imports: [Plan] });

  it('does not invent a year when none is saved', async () => {
    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Plan');
    expect(fixture.nativeElement.textContent).not.toMatch(/\d{4}/);
  });

  it('shows the stored starting year in the header', async () => {
    await testDb.store.insert(COLLECTIONS.settings, { startingYear: 2026 });

    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('2026');
  });
});

describe('Plan category sections', () => {
  provideTestDocumentStore('pb-53-plan', { imports: [Plan] });

  const render = async () => {
    const fixture = TestBed.createComponent(Plan);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const submitInSection = async (fixture: ComponentFixture<Plan>, type: string, name: string) => {
    const section = fixture.nativeElement.querySelector(
      `section[data-type="${type}"]`,
    ) as HTMLElement;
    const input = section.querySelector(`#category-name-${type}`) as HTMLInputElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    section.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const listNames = (fixture: ComponentFixture<Plan>, type: string) =>
    [...fixture.nativeElement.querySelectorAll(`section[data-type="${type}"] li`)].map(
      (el: Element) => el.textContent?.trim(),
    );

  it('renders income, expense, and savings sections', async () => {
    const fixture = await render();
    const types = [...fixture.nativeElement.querySelectorAll('section[data-type]')].map(
      (el: Element) => el.getAttribute('data-type'),
    );
    expect(types).toEqual(['income', 'expense', 'savings']);
    expect(fixture.nativeElement.querySelector('section[data-type="income"] h2')?.textContent).toBe(
      'Income',
    );
    expect(
      fixture.nativeElement.querySelector('section[data-type="expense"] h2')?.textContent,
    ).toBe('Expenses');
    expect(
      fixture.nativeElement.querySelector('section[data-type="savings"] h2')?.textContent,
    ).toBe('Savings');
  });

  it('keeps an expense add inside the expense section only', async () => {
    const fixture = await render();
    await submitInSection(fixture, 'expense', 'Rent');

    expect(listNames(fixture, 'expense')).toEqual(['Rent']);
    expect(listNames(fixture, 'income')).toEqual([]);
    expect(listNames(fixture, 'savings')).toEqual([]);
  });
});
