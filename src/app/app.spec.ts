import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { APP_TABS, routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  async function renderAt(url: string) {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders four tab links that navigate via the router', async () => {
    const fixture = await renderAt('/');
    expect(TestBed.inject(Router).url).toBe('/dashboard');

    const links = [...fixture.nativeElement.querySelectorAll('nav a')] as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent?.trim())).toEqual(APP_TABS.map((tab) => tab.label));

    const plan = links.find((link) => link.textContent?.trim() === 'Plan');
    plan?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/plan');
    expect(plan?.getAttribute('aria-current')).toBe('page');
  });

  it('activates an empty routed component for each tab', async () => {
    const fixture = await renderAt('/');

    for (const tab of APP_TABS) {
      await TestBed.inject(Router).navigateByUrl('/' + tab.path);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('app-' + tab.path)).not.toBeNull();
      expect(TestBed.inject(Router).url).toBe('/' + tab.path);
    }
  });

  it('keeps unknown paths on a 404 page with no tab selected', async () => {
    const fixture = await renderAt('/not-a-tab');

    expect(TestBed.inject(Router).url).toBe('/not-a-tab');
    expect(fixture.nativeElement.querySelector('app-not-found')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('nav a[aria-current]')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Page not found');
  });
});
