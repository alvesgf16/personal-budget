import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { SettingsService } from '../../data/domains/settings/settings.service';
import { withPendingTask } from '../shared/with-pending-task';
import { PlanCategorySection } from './plan-category-section/plan-category-section';

/** Plan tab: year header and income / expense / savings category sections. */
@Component({
  selector: 'app-plan',
  imports: [PlanCategorySection],
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
