import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { SettingsService } from '../../data/domains/settings/settings.service';
import { runWhilePending } from '../shared/helpers/run-while-pending';
import { PlanAllocationStatus } from './components/plan-allocation-status/plan-allocation-status';
import { PlanCategorySection } from './components/plan-category-section/plan-category-section';

@Component({
  selector: 'app-plan',
  imports: [PlanAllocationStatus, PlanCategorySection],
  styleUrl: './plan.css',
  templateUrl: './plan.html',
})
export class Plan implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly startingYear = signal<number | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    await runWhilePending(() => this.loadStartingYear(), this.pendingTasks);
  }

  private async loadStartingYear(): Promise<void> {
    const settings = await this.settingsService.get();

    this.startingYear.set(settings?.startingYear ?? null);
  }
}
