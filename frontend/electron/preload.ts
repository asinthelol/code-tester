import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { ImportedFile, RunEvent } from '../src/shared/lib/types.ts';

contextBridge.exposeInMainWorld('electron', {
  importFile: (): Promise<ImportedFile | null> =>
    ipcRenderer.invoke('file:import'),

  runStart: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('run:start', filePath),

  runStop: (): Promise<void> => ipcRenderer.invoke('run:stop'),

  onRunEvent: (listener: (event: RunEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: RunEvent) => listener(payload);
    ipcRenderer.on('run:event', handler);
    return () => ipcRenderer.removeListener('run:event', handler);
  },
});
