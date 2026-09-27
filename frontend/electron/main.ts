import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import { registerFileHandlers } from './ipc/file.ts';
import { registerStateHandlers } from './ipc/state.ts';
import { registerRepoHandlers } from './ipc/repo.ts';
import { registerSupervisorHandlers } from './ipc/supervisor.ts';
import { registerEnvironmentHandlers, getReadyEnvironments } from './ipc/environment.ts';
import { registerSuiteHandlers } from './ipc/suite.ts';
import { cancelCppTarget } from './lib/suite/runCppTarget.ts';
import { detachSupervisor } from './lib/environment/supervisor.ts';
import { detachLocalWorker } from './lib/environment/localWorker.ts';
import { cancelScaffold } from './lib/repo/scaffoldRepo.ts';
import { stopEnvironment } from './lib/environment/environment.ts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

Menu.setApplicationMenu(null);

registerFileHandlers();
registerStateHandlers();
registerRepoHandlers();
registerSupervisorHandlers();
registerEnvironmentHandlers();
registerSuiteHandlers();

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

  cancelCppTarget();
  detachSupervisor();
  detachLocalWorker();
  cancelScaffold();

  const readyEnvironments = getReadyEnvironments();
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
