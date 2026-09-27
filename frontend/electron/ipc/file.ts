import { BrowserWindow, ipcMain } from 'electron';
import { importFile } from '../lib/fs/importFile.ts';
import { saveFile } from '../lib/fs/saveFile.ts';
import { deleteFileFromDisk } from '../lib/fs/deleteFile.ts';
import { IPC_CHANNELS } from '../../shared/electronApi.ts';

export function registerFileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.fileImport, (event) =>
    importFile(BrowserWindow.fromWebContents(event.sender))
  );

  ipcMain.handle(IPC_CHANNELS.fileSave, (_event, filePath: string, content: string) =>
    saveFile(filePath, content)
  );

  ipcMain.handle(IPC_CHANNELS.fsDeleteFile, (_event, filePath: string) => deleteFileFromDisk(filePath));
}
