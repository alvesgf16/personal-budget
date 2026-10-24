import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { APP_TABS, routes } from './app.routes';
import { appHarness } from './app.harness';

describe('App', () => {
  const {
    renderAt,
    navigateTo,
    navLinks,
    clickNavLabel,
    routerUrl,
    routedOutlet,
    notFoundOutlet,
    currentNavLink,
    pageHeading,
  } = appHarness();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('renders tab labels that match APP_TABS', async () => {
    const fixture = await renderAt('/');
    const labels = navLinks(fixture).map((link) => link.textContent?.trim());

    expect(routerUrl()).toBe('/dashboard');
    expect(labels).toEqual(APP_TABS.map((tab) => tab.label));
  });

  it('navigates to Plan and marks the Plan tab current', async () => {
    const fixture = await renderAt('/');

    const plan = await clickNavLabel(fixture, 'Plan');

    expect(routerUrl()).toBe('/plan');
    expect(plan?.getAttribute('aria-current')).toBe('page');
  });

  it.each(APP_TABS)('activates an empty routed component for the $label tab', async (tab) => {
    const fixture = await renderAt('/');

    await navigateTo(fixture, '/' + tab.path);

    expect(routedOutlet(fixture, tab.path)).not.toBeNull();
    expect(routerUrl()).toBe('/' + tab.path);
  });

  it('keeps unknown paths on a 404 page with no tab selected', async () => {
    const fixture = await renderAt('/not-a-tab');

    expect(routerUrl()).toBe('/not-a-tab');
    expect(notFoundOutlet(fixture)).not.toBeNull();
    expect(currentNavLink(fixture)).toBeNull();
    expect(pageHeading(fixture)).toContain('Page not found');
  });
});
