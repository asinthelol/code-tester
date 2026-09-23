import { contextBridge, ipcRenderer } from 'electron';
import type { ImportedFile } from '../src/shared/lib/types.ts';

contextBridge.exposeInMainWorld('electron', {
  importFile: (): Promise<ImportedFile | null> =>
    ipcRenderer.invoke('file:import'),
});
