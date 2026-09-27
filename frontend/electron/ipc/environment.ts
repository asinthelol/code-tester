import { BrowserWindow, ipcMain } from 'electron';
import {
  cancelStart,
  importEnvironment,
  startEnvironment,
  stopEnvironment,
} from '../lib/environment.ts';
import { attachSupervisor, detachSupervisor } from '../lib/supervisor.ts';
import { IPC_CHANNELS } from '../../shared/electronApi.ts';
import { isTerminalSuiteEvent } from './shared.ts';
import { runPendingCleanup } from './supervisor.ts';

// configPaths of environments that reached "ready" and haven't been
// explicitly stopped
const readyEnvironments = new Set<string>();

export function getReadyEnvironments(): Set<string> {
  return readyEnvironments;
}

export function registerEnvironmentHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.environmentImport, (event) =>
    importEnvironment(BrowserWindow.fromWebContents(event.sender))
  );

  ipcMain.handle(IPC_CHANNELS.environmentStart, (event, configPath: string) =>
    startEnvironment(configPath, (envEvent) => {
      event.sender.send(IPC_CHANNELS.environmentEvent, envEvent);
      if (envEvent.type === 'environment.ready') {
        readyEnvironments.add(configPath);
        attachSupervisor(configPath, (supervisorEvent) => {
          event.sender.send(IPC_CHANNELS.supervisorEvent, supervisorEvent);
          if (isTerminalSuiteEvent(supervisorEvent)) {
            runPendingCleanup(supervisorEvent.runId);
          }
        });
      }
    })
  );

  ipcMain.handle(IPC_CHANNELS.environmentCancelStart, () => cancelStart());

  ipcMain.handle(IPC_CHANNELS.environmentStop, (event, configPath: string) => {
    detachSupervisor();
    readyEnvironments.delete(configPath);
    return stopEnvironment(configPath, (envEvent) =>
      event.sender.send(IPC_CHANNELS.environmentEvent, envEvent)
    );
  });
}
