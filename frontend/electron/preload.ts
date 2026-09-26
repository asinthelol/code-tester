import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type {
  EnvironmentEvent,
  ImportedFile,
  IntegrationEnvironment,
  RunEvent,
  RunRequest,
  TargetRunRequest,
} from '../src/shared/lib/types.ts';
import type { Event as SupervisorEvent } from '../../protocol/v1/typescript/index.ts';

contextBridge.exposeInMainWorld('electron', {
  importFile: (): Promise<ImportedFile | null> =>
    ipcRenderer.invoke('file:import'),

  saveFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('file:save', filePath, content),

  runStart: (request: RunRequest): Promise<void> =>
    ipcRenderer.invoke('run:start', request),

  runStop: (): Promise<void> => ipcRenderer.invoke('run:stop'),

  onRunEvent: (listener: (event: RunEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: RunEvent) => listener(payload);
    ipcRenderer.on('run:event', handler);
    return () => ipcRenderer.removeListener('run:event', handler);
  },

  importEnvironment: (): Promise<IntegrationEnvironment | null> =>
    ipcRenderer.invoke('environment:import'),

  environmentStart: (configPath: string): Promise<void> =>
    ipcRenderer.invoke('environment:start', configPath),

  environmentCancelStart: (): Promise<void> =>
    ipcRenderer.invoke('environment:cancelStart'),

  environmentStop: (configPath: string): Promise<void> =>
    ipcRenderer.invoke('environment:stop', configPath),

  onEnvironmentEvent: (listener: (event: EnvironmentEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: EnvironmentEvent) => listener(payload);
    ipcRenderer.on('environment:event', handler);
    return () => ipcRenderer.removeListener('environment:event', handler);
  },

  supervisorExecute: (runId: string, entryPoint: string): Promise<void> =>
    ipcRenderer.invoke('supervisor:execute', runId, entryPoint),

  supervisorCancel: (runId: string, configPath: string): Promise<void> =>
    ipcRenderer.invoke('supervisor:cancel', runId, configPath),

  runTargetSuite: (request: TargetRunRequest): Promise<void> =>
    ipcRenderer.invoke('suite:runTarget', request),

  runLocalSuite: (runId: string, entryPoint: string): Promise<void> =>
    ipcRenderer.invoke('suite:runLocal', runId, entryPoint),

  cancelLocalSuite: (runId: string): Promise<void> =>
    ipcRenderer.invoke('suite:cancelLocal', runId),

  onSupervisorEvent: (listener: (event: SupervisorEvent) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: SupervisorEvent) => listener(payload);
    ipcRenderer.on('supervisor:event', handler);
    return () => ipcRenderer.removeListener('supervisor:event', handler);
  },
});
