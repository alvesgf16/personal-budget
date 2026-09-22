import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { NotFound } from './not-found/not-found';
import { Plan } from './plan/plan';
import { Settings } from './settings/settings';
import { Tracking } from './tracking/tracking';

/** Tab paths, labels, and empty page components — single source for the router and nav. */
export const APP_TABS = [
  { path: 'dashboard', label: 'Dashboard', component: Dashboard },
  { path: 'plan', label: 'Plan', component: Plan },
  { path: 'tracking', label: 'Tracking', component: Tracking },
  { path: 'settings', label: 'Settings', component: Settings },
] as const;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: APP_TABS[0].path },
  ...APP_TABS.map(({ path, component }) => ({ path, component })),
  { path: '**', component: NotFound },
];
