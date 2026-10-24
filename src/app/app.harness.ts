import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';

export function appHarness() {
  const renderAt = async (url: string) => {
    const fixture = TestBed.createComponent(App);

    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();

    return fixture;
  };

  const navigateTo = async (fixture: ComponentFixture<App>, url: string) => {
    await TestBed.inject(Router).navigateByUrl(url);

    fixture.detectChanges();
    await fixture.whenStable();
  };

  const navLinks = (fixture: ComponentFixture<App>) =>
    [...fixture.nativeElement.querySelectorAll('nav a')] as HTMLAnchorElement[];

  const linkByLabel = (fixture: ComponentFixture<App>, label: string) =>
    navLinks(fixture).find((link) => link.textContent?.trim() === label);

  const clickNavLabel = async (fixture: ComponentFixture<App>, label: string) => {
    const link = linkByLabel(fixture, label);

    link?.click();

    fixture.detectChanges();
    await fixture.whenStable();

    return link;
  };

  const routerUrl = () => TestBed.inject(Router).url;

  const routedOutlet = (fixture: ComponentFixture<App>, path: string) =>
    fixture.nativeElement.querySelector(`app-${path}`);

  const notFoundOutlet = (fixture: ComponentFixture<App>) =>
    fixture.nativeElement.querySelector('app-not-found');

  const currentNavLink = (fixture: ComponentFixture<App>) =>
    fixture.nativeElement.querySelector('nav a[aria-current]');

  const pageHeading = (fixture: ComponentFixture<App>) =>
    fixture.nativeElement.querySelector('h1')?.textContent ?? '';

  return {
    renderAt,
    navigateTo,
    navLinks,
    linkByLabel,
    clickNavLabel,
    routerUrl,
    routedOutlet,
    notFoundOutlet,
    currentNavLink,
    pageHeading,
  };
}
