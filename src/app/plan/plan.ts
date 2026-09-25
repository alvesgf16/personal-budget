import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { SettingsService } from '../../data/settings.service';

/** Plan tab year header, driven by Settings (PB-19). */
@Component({
  selector: 'app-plan',
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
    const done = this.pendingTasks.add();
    try {
      const doc = await this.settings.load();
      this.startingYear.set(doc?.startingYear ?? null);
    } finally {
      done();
    }
  }
}
