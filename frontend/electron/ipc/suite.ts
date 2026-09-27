import { ipcMain } from 'electron';
import path from 'node:path';
import {
  attachLocalWorker,
  cancelLocalSuite,
  clearLocalCancelGrace,
  detachLocalWorker,
  sendLocalCommand,
} from '../lib/environment/localWorker.ts';
import { executeSuite } from '../lib/environment/supervisor.ts';
import { synthesizeDockerTarget, synthesizeLocalTarget, buildPythonSource } from '../lib/suite/synthesizeTarget.ts';
import { cancelCppTarget, runCppTarget } from '../lib/suite/runCppTarget.ts';
import { IPC_CHANNELS } from '../../shared/electronApi.ts';
import { adapterForExtension, isTerminalSuiteEvent } from './shared.ts';
import { pendingCleanups } from './supervisor.ts';
import type { TargetRunRequest } from '../../shared/types.ts';

export function registerSuiteHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.suiteRunTarget, async (event, request: TargetRunRequest) => {
    const { runId, testName, target, sourceContent, extension, environmentPath } = request;
    const adapter = adapterForExtension(extension);
    const buildSource = extension === 'py' ? buildPythonSource : undefined;

    if (environmentPath) {
      const synthesized = await synthesizeDockerTarget(
        sourceContent,
        testName,
        target,
        extension,
        environmentPath,
        buildSource
      );
      pendingCleanups.set(runId, synthesized.cleanup);
      executeSuite(runId, synthesized.entryPoint, adapter);
      return;
    }

    const synthesized = await synthesizeLocalTarget(sourceContent, testName, target, extension, buildSource);
    attachLocalWorker(synthesized.suiteRoot, (workerEvent) => {
      event.sender.send(IPC_CHANNELS.supervisorEvent, workerEvent);
      if (isTerminalSuiteEvent(workerEvent)) {
        clearLocalCancelGrace();
        detachLocalWorker();
        void synthesized.cleanup();
      }
    });
    sendLocalCommand({ protocolVersion: 1, runId, type: 'run', adapter, entryPoint: synthesized.entryPoint });
  });

  ipcMain.handle(IPC_CHANNELS.suiteRunCppTarget, (event, request: TargetRunRequest) =>
    runCppTarget(request, (suiteEvent) => event.sender.send(IPC_CHANNELS.supervisorEvent, suiteEvent))
  );

  ipcMain.handle(IPC_CHANNELS.suiteCancelCppTarget, () => cancelCppTarget());

  ipcMain.handle(IPC_CHANNELS.suiteRunLocal, (event, runId: string, entryPoint: string) => {
    attachLocalWorker(process.cwd(), (workerEvent) => {
      event.sender.send(IPC_CHANNELS.supervisorEvent, workerEvent);
      if (isTerminalSuiteEvent(workerEvent)) {
        clearLocalCancelGrace();
        detachLocalWorker();
      }
    });
    const adapter = adapterForExtension(path.extname(entryPoint).slice(1));
    sendLocalCommand({ protocolVersion: 1, runId, type: 'run', adapter, entryPoint });
  });

  ipcMain.handle(IPC_CHANNELS.suiteCancelLocal, (event, runId: string) =>
    cancelLocalSuite(runId, () => {
      console.warn(`Local worker did not acknowledge cancel for run ${runId}; force-killed.`);
      event.sender.send(IPC_CHANNELS.supervisorEvent, {
        protocolVersion: 1,
        runId,
        type: 'run.aborted',
      });
    })
  );
}
