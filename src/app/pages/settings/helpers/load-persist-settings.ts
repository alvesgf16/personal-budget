import type { PendingTasks } from '@angular/core';
import type { Settings } from '../../../../data/domains/settings/settings';
import { attemptWhilePending } from '../../../shared/helpers/attempt-while-pending';
import type { RevisionCounter } from '../../../shared/helpers/create-revision-counter';
import { applyLoadedSettings } from './settings-form';
import type { SettingsFormField, SettingsFormSignals } from '../types';

interface SettingsStatusHandlers {
  clear: () => void;
  fail: (message: string) => void;
}

interface LoadSettingsPageInput extends SettingsStatusHandlers {
  pendingTasks: PendingTasks;
  revisions: RevisionCounter;
  fetch: () => Promise<Settings | null>;
  fields: SettingsFormSignals;
  dirtyFields: ReadonlySet<SettingsFormField>;
  markReady: () => void;
}

interface PersistSettingsPageInput extends SettingsStatusHandlers {
  settings: Settings;
  pendingTasks: PendingTasks;
  revisions: RevisionCounter;
  save: (settings: Settings) => Promise<void>;
  clearDirty: () => void;
}

interface FailIfCurrentInput extends SettingsStatusHandlers {
  revisions: RevisionCounter;
}

export async function loadSettingsPage(input: LoadSettingsPageInput): Promise<void> {
  const revision = input.revisions.next();

  try {
    await attemptWhilePending(
      async () => {
        input.clear();
        const settings = await input.fetch();

        if (settings) {
          applyLoadedSettings(settings, input.fields, input.dirtyFields);
        }
      },
      input.pendingTasks,
      () => failIfCurrent(input, revision, 'Could not load settings. Refresh and try again.'),
    );
  } finally {
    input.markReady();
  }
}

export async function persistSettingsPage(input: PersistSettingsPageInput): Promise<void> {
  const revision = input.revisions.next();

  await attemptWhilePending(
    async () => {
      input.clear();
      await input.save(input.settings);
      input.clearDirty();
    },
    input.pendingTasks,
    () => failIfCurrent(input, revision, 'Could not save settings. Try again.'),
  );
}

function failIfCurrent(input: FailIfCurrentInput, revision: number, message: string): void {
  if (revision === input.revisions.current()) {
    input.fail(message);
  }
}
