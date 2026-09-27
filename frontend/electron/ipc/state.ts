import { ipcMain } from 'electron';
import { loadState, saveState } from '../lib/fs/appState.ts';
import { IPC_CHANNELS } from '../../shared/electronApi.ts';
import type { PersistedState } from '../../shared/types.ts';

export function registerStateHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.stateLoad, () => loadState());

  ipcMain.handle(IPC_CHANNELS.stateSave, (_event, state: PersistedState) => saveState(state));
}
