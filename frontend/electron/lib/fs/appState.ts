import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { PersistedState } from '../../../shared/types.ts';

const EMPTY_STATE: PersistedState = {
  files: [],
  tests: [],
  environments: [],
  repos: [],
};

function statePath(): string {
  return path.join(app.getPath('userData'), 'state.json');
}

export async function loadState(): Promise<PersistedState> {
  try {
    const content = await fs.readFile(statePath(), 'utf-8');
    const parsed = JSON.parse(content) as Partial<PersistedState>;
    return {
      files: parsed.files ?? [],
      tests: parsed.tests ?? [],
      environments: parsed.environments ?? [],
      repos: parsed.repos ?? [],
    };
  } catch {
    // No state file yet (fresh install) or it's corrupt
    // start from an empty state
    return EMPTY_STATE;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await fs.writeFile(statePath(), JSON.stringify(state, null, 2), 'utf-8');
}
