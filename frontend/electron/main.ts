import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'node:path';
import { importFile } from './lib/importFile.ts';
import { runTest, stopTest } from './lib/runTest.ts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

Menu.setApplicationMenu(null);

ipcMain.handle('file:import', (event) =>
  importFile(BrowserWindow.fromWebContents(event.sender))
);

ipcMain.handle('run:start', (event, filePath: string) => {
  runTest(filePath, (runEvent) => event.sender.send('run:event', runEvent));
});

ipcMain.handle('run:stop', () => stopTest());

app.on('before-quit', stopTest);

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