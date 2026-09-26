import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'node:path';
import { importFile } from './lib/importFile.ts';
import { saveFile } from './lib/saveFile.ts';
import { runTest, stopTest } from './lib/runTest.ts';
import {
  cancelStart,
  importEnvironment,
  startEnvironment,
  stopEnvironment,
} from './lib/environment.ts';
import {
  attachSupervisor,
  cancelSuite,
  detachSupervisor,
  executeSuite,
} from './lib/supervisor.ts';
import {
  attachLocalWorker,
  cancelLocalSuite,
  clearLocalCancelGrace,
  detachLocalWorker,
  sendLocalCommand,
} from './lib/localWorker.ts';
import { synthesizeDockerTarget, synthesizeLocalTarget } from './lib/synthesizeTarget.ts';
import type { RunRequest, TargetRunRequest } from '../src/shared/lib/types.ts';
import type { Event as SuiteEvent } from '../../protocol/v1/typescript/index.ts';

function isTerminalSuiteEvent(event: SuiteEvent): boolean {
  return event.type === 'run.completed' || event.type === 'run.failed' || event.type === 'run.aborted';
}

const pendingCleanups = new Map<string, () => Promise<void>>();

function runPendingCleanup(runId: string): void {
  const cleanup = pendingCleanups.get(runId);
  if (cleanup) {
    pendingCleanups.delete(runId);
    void cleanup();
  }
}

// configPaths of environments that reached "ready" and haven't been
// explicitly stopped torn down automatically on quit.
const readyEnvironments = new Set<string>();



declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

Menu.setApplicationMenu(null);

ipcMain.handle('file:import', (event) =>
  importFile(BrowserWindow.fromWebContents(event.sender))
);

ipcMain.handle('file:save', (_event, filePath: string, content: string) =>
  saveFile(filePath, content)
);

ipcMain.handle('run:start', (event, request: RunRequest) =>
  runTest(request, (runEvent) => event.sender.send('run:event', runEvent))
);

ipcMain.handle('run:stop', () => stopTest());

ipcMain.handle('environment:import', (event) =>
  importEnvironment(BrowserWindow.fromWebContents(event.sender))
);

ipcMain.handle('environment:start', (event, configPath: string) =>
  startEnvironment(configPath, (envEvent) => {
    event.sender.send('environment:event', envEvent);
    if (envEvent.type === 'environment.ready') {
      readyEnvironments.add(configPath);
      attachSupervisor(configPath, (supervisorEvent) => {
        event.sender.send('supervisor:event', supervisorEvent);
        if (isTerminalSuiteEvent(supervisorEvent)) {
          runPendingCleanup(supervisorEvent.runId);
        }
      });
    }
  })
);

ipcMain.handle('environment:cancelStart', () => cancelStart());

ipcMain.handle('environment:stop', (event, configPath: string) => {
  detachSupervisor();
  readyEnvironments.delete(configPath);
  return stopEnvironment(configPath, (envEvent) =>
    event.sender.send('environment:event', envEvent)
  );
});

ipcMain.handle('supervisor:execute', (_event, runId: string, entryPoint: string) =>
  executeSuite(runId, entryPoint)
);

ipcMain.handle('supervisor:cancel', (event, runId: string, configPath: string) =>
  cancelSuite(runId, configPath, () => {
    console.warn(`Supervisor did not acknowledge cancel for run ${runId}; force-killed.`);
    event.sender.send('supervisor:event', {
      protocolVersion: 1,
      runId,
      type: 'run.aborted',
    });
    runPendingCleanup(runId);
  })
);

ipcMain.handle('suite:runTarget', async (event, request: TargetRunRequest) => {
  const { runId, testName, target, sourceContent, extension, environmentPath } = request;

  if (environmentPath) {
    const synthesized = await synthesizeDockerTarget(
      sourceContent,
      testName,
      target,
      extension,
      environmentPath
    );
    pendingCleanups.set(runId, synthesized.cleanup);
    executeSuite(runId, synthesized.entryPoint);
    return;
  }

  const synthesized = await synthesizeLocalTarget(sourceContent, testName, target, extension);
  attachLocalWorker(synthesized.suiteRoot, (workerEvent) => {
    event.sender.send('supervisor:event', workerEvent);
    if (isTerminalSuiteEvent(workerEvent)) {
      clearLocalCancelGrace();
      detachLocalWorker();
      void synthesized.cleanup();
    }
  });
  sendLocalCommand({ protocolVersion: 1, runId, type: 'run', adapter: 'node', entryPoint: synthesized.entryPoint });
});

ipcMain.handle('suite:runLocal', (event, runId: string, entryPoint: string) => {
  attachLocalWorker(process.cwd(), (workerEvent) => {
    event.sender.send('supervisor:event', workerEvent);
    if (isTerminalSuiteEvent(workerEvent)) {
      clearLocalCancelGrace();
      detachLocalWorker();
    }
  });
  sendLocalCommand({ protocolVersion: 1, runId, type: 'run', adapter: 'node', entryPoint });
});

ipcMain.handle('suite:cancelLocal', (event, runId: string) =>
  cancelLocalSuite(runId, () => {
    console.warn(`Local worker did not acknowledge cancel for run ${runId}; force-killed.`);
    event.sender.send('supervisor:event', {
      protocolVersion: 1,
      runId,
      type: 'run.aborted',
    });
  })
);

const STOP_ENVIRONMENTS_TIMEOUT_MS = 15_000;

function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

let quitting = false;

app.on('before-quit', (event) => {
  if (quitting) return;
  event.preventDefault();
  quitting = true;

  stopTest();
  detachSupervisor();
  detachLocalWorker();

  const shutdowns = [...readyEnvironments].map((configPath) => stopEnvironment(configPath));
  readyEnvironments.clear();

  void withTimeout(Promise.all(shutdowns).then(() => {}), STOP_ENVIRONMENTS_TIMEOUT_MS).then(() => {
    app.quit();
  });
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 540,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});