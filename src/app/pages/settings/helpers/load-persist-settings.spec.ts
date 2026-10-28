import type { Settings } from '../../../../data/domains/settings/settings';
import { stubPendingTasks } from '../../../shared/harness/stub-pending-tasks.harness';
import { createRevisionCounter } from '../../../shared/helpers/create-revision-counter';
import { loadSettingsPage, persistSettingsPage } from './load-persist-settings';
import { settingsFormInput } from './settings-form';
import { emptyFormSignals, storedSettings } from '../settings-page.harness';

describe('loadSettingsPage', () => {
  it('hydrates fetched settings, clears status, and marks ready', async () => {
    const { pendingTasks } = stubPendingTasks();
    const fields = emptyFormSignals();
    let cleared = false;
    let ready = false;

    await loadSettingsPage({
      pendingTasks,
      revisions: createRevisionCounter(),
      fetch: () => Promise.resolve(storedSettings),
      fields,
      dirtyFields: new Set(),
      clear: () => {
        cleared = true;
      },
      fail: () => {
        throw new Error('fail should not run');
      },
      markReady: () => {
        ready = true;
      },
    });

    expect(cleared).toBe(true);
    expect(ready).toBe(true);
    expect(settingsFormInput(fields)).toEqual({
      startingYear: '2026',
      lateIncomeShift: 'active',
      lateIncomeShiftStartingDay: '20',
    });
  });

  it('marks ready and reports when fetch fails on the current revision', async () => {
    const { pendingTasks } = stubPendingTasks();
    let ready = false;
    let failure: string | null = null;

    await loadSettingsPage({
      pendingTasks,
      revisions: createRevisionCounter(),
      fetch: () => Promise.reject(new Error('unavailable')),
      fields: emptyFormSignals(),
      dirtyFields: new Set(),
      clear: () => undefined,
      fail: (message) => {
        failure = message;
      },
      markReady: () => {
        ready = true;
      },
    });

    expect(ready).toBe(true);
    expect(failure).toContain('Could not load');
  });

  it('marks ready without reporting when the load revision is stale', async () => {
    const { pendingTasks } = stubPendingTasks();
    const revisions = createRevisionCounter();
    let ready = false;
    let failure: string | null = null;

    await loadSettingsPage({
      pendingTasks,
      revisions,
      fetch: () => {
        revisions.next();
        return Promise.reject(new Error('unavailable'));
      },
      fields: emptyFormSignals(),
      dirtyFields: new Set(),
      clear: () => undefined,
      fail: (message) => {
        failure = message;
      },
      markReady: () => {
        ready = true;
      },
    });

    expect(ready).toBe(true);
    expect(failure).toBeNull();
  });
});

describe('persistSettingsPage', () => {
  it('saves, clears dirty fields, and skips fail on success', async () => {
    const { pendingTasks } = stubPendingTasks();
    let saved: Settings | null = null;
    let dirtyCleared = false;

    await persistSettingsPage({
      pendingTasks,
      revisions: createRevisionCounter(),
      settings: storedSettings,
      save: (settings) => {
        saved = settings;
        return Promise.resolve();
      },
      clearDirty: () => {
        dirtyCleared = true;
      },
      clear: () => undefined,
      fail: () => {
        throw new Error('fail should not run');
      },
    });

    expect(saved).toEqual(storedSettings);
    expect(dirtyCleared).toBe(true);
  });

  it('reports when save fails on the current revision', async () => {
    const { pendingTasks } = stubPendingTasks();
    let failure: string | null = null;

    await persistSettingsPage({
      pendingTasks,
      revisions: createRevisionCounter(),
      settings: storedSettings,
      save: () => Promise.reject(new Error('unavailable')),
      clearDirty: () => undefined,
      clear: () => undefined,
      fail: (message) => {
        failure = message;
      },
    });

    expect(failure).toContain('Could not save');
  });

  it('skips reporting when the save revision is stale', async () => {
    const { pendingTasks } = stubPendingTasks();
    const revisions = createRevisionCounter();
    let failure: string | null = null;

    await persistSettingsPage({
      pendingTasks,
      revisions,
      settings: storedSettings,
      save: () => {
        revisions.next();
        return Promise.reject(new Error('unavailable'));
      },
      clearDirty: () => undefined,
      clear: () => undefined,
      fail: (message) => {
        failure = message;
      },
    });

    expect(failure).toBeNull();
  });
});
