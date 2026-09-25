import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'node:path';
import { importFile } from './lib/importFile.ts';
import { saveFile, saveFileAs } from './lib/saveFile.ts';
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
import type { RunRequest } from '../src/shared/lib/types.ts';



declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

Menu.setApplicationMenu(null);

ipcMain.handle('file:import', (event) =>
  importFile(BrowserWindow.fromWebContents(event.sender))
);

ipcMain.handle('file:save', (_event, filePath: string, content: string) =>
  saveFile(filePath, content)
);

ipcMain.handle('file:saveAs', (event, content: string, suggestedName: string) =>
  saveFileAs(BrowserWindow.fromWebContents(event.sender), content, suggestedName)
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
      attachSupervisor(configPath, (supervisorEvent) =>
        event.sender.send('supervisor:event', supervisorEvent)
      );
    }
  })
);

ipcMain.handle('environment:cancelStart', () => cancelStart());

ipcMain.handle('environment:stop', (event, configPath: string) => {
  detachSupervisor();
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
  })
);

app.on('before-quit', () => {
  stopTest();
  detachSupervisor();
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