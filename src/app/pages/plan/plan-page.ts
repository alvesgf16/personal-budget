import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { SettingsService } from '../../../data/domains/settings/settings.service';
import { attemptWhilePending } from '../../shared/helpers/attempt-while-pending';
import { PlanAllocationStatus } from './components/plan-allocation-status/plan-allocation-status';
import { PlanCategorySection } from './components/plan-category-section/plan-category-section';

@Component({
  selector: 'app-plan',
  imports: [PlanAllocationStatus, PlanCategorySection],
  styleUrl: './plan-page.css',
  templateUrl: './plan-page.html',
})
export class PlanPage implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly startingYear = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    await attemptWhilePending(
      () => this.loadStartingYear(),
      this.pendingTasks,
      () => this.error.set('Could not load the plan year. Refresh and try again.'),
    );
  }

  private async loadStartingYear(): Promise<void> {
    this.error.set(null);

    const settings = await this.settingsService.get();

    this.startingYear.set(settings?.startingYear ?? null);
  }
}
