import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { SettingsService } from '../../data/domains/settings/settings.service';
import { withPendingTask } from '../shared/helpers/with-pending-task';
import { PlanAllocationStatus } from './components/plan-allocation-status/plan-allocation-status';
import { PlanCategorySection } from './components/plan-category-section/plan-category-section';

/** Plan tab: year header, allocation status strip, and income / expense / savings sections. */
@Component({
  selector: 'app-plan',
  imports: [PlanAllocationStatus, PlanCategorySection],
  styleUrl: './plan.css',
  templateUrl: './plan.html',
})
export class Plan implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly startingYear = signal<number | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    await withPendingTask(this.pendingTasks, async () => {
      const doc = await this.settings.load();
      this.startingYear.set(doc?.startingYear ?? null);
    });
  }
}
