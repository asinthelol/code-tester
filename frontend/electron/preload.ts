import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { ImportedFile, RunEvent, RunRequest } from '../src/shared/lib/types.ts';

contextBridge.exposeInMainWorld('electron', {
  importFile: (): Promise<ImportedFile | null> =>
    ipcRenderer.invoke('file:import'),

  saveFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('file:save', filePath, content),

  saveFileAs: (
    content: string,
    suggestedName: string
  ): Promise<{ path: string; name: string } | null> =>
    ipcRenderer.invoke('file:saveAs', content, suggestedName),

  runStart: (request: RunRequest): Promise<void> =>
    ipcRenderer.invoke('run:start', request),

  runStop: (): Promise<void> => ipcRenderer.invoke('run:stop'),

  onRunEvent: (listener: (event: RunEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: RunEvent) => listener(payload);
    ipcRenderer.on('run:event', handler);
    return () => ipcRenderer.removeListener('run:event', handler);
  },
});
