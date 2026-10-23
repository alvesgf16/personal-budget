import type { PendingTasks } from '@angular/core';

/** Spec stub: counts open PendingTasks slots without Angular DI. */
export function stubPendingTasks(): { pendingTasks: PendingTasks; open: () => number } {
  let open = 0;
  const pendingTasks = {
    add: () => {
      open += 1;
      return () => {
        open -= 1;
      };
    },
  } as PendingTasks;
  return { pendingTasks, open: () => open };
}
