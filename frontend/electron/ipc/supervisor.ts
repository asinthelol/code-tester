import { ipcMain } from 'electron';
import { cancelSuite, executeSuite } from '../lib/supervisor.ts';
import { IPC_CHANNELS } from '../../shared/electronApi.ts';
import { adapterForExtension } from './shared.ts';
import path from 'node:path';

// Cleanup callbacks for synthesized target-mode temp files, keyed by runId.
// suite.ts's Docker branch of suite:runTarget writes into this map; this
// module (owner of supervisor:cancel) fires the matching cleanup once a run
// terminates or is force-killed after a cancel-grace timeout.
export const pendingCleanups = new Map<string, () => Promise<void>>();

export function runPendingCleanup(runId: string): void {
  const cleanup = pendingCleanups.get(runId);
  if (cleanup) {
    pendingCleanups.delete(runId);
    void cleanup();
  }
}

export function registerSupervisorHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.supervisorExecute, (_event, runId: string, entryPoint: string) =>
    executeSuite(runId, entryPoint, adapterForExtension(path.extname(entryPoint).slice(1)))
  );

  ipcMain.handle(IPC_CHANNELS.supervisorCancel, (event, runId: string, configPath: string) =>
    cancelSuite(runId, configPath, () => {
      console.warn(`Supervisor did not acknowledge cancel for run ${runId}; force-killed.`);
      event.sender.send(IPC_CHANNELS.supervisorEvent, {
        protocolVersion: 1,
        runId,
        type: 'run.aborted',
      });
      runPendingCleanup(runId);
    })
  );
}
