import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard-page';
import { NotFoundPage } from './pages/not-found/not-found-page';
import { PlanPage } from './pages/plan/plan-page';
import { SettingsPage } from './pages/settings/settings-page';
import { TrackingPage } from './pages/tracking/tracking-page';

export const APP_TABS = [
  { path: 'dashboard', label: 'Dashboard', component: DashboardPage },
  { path: 'plan', label: 'Plan', component: PlanPage },
  { path: 'tracking', label: 'Tracking', component: TrackingPage },
  { path: 'settings', label: 'Settings', component: SettingsPage },
] as const;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: APP_TABS[0].path },
  ...APP_TABS.map(({ path, component }) => ({ path, component })),
  { path: '**', component: NotFoundPage },
];
