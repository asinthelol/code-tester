import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../shared/electronApi.ts';
import type { ElectronAPI } from '../shared/electronApi.ts';
import type {
  EnvironmentEvent,
  PersistedState,
  RepoScaffoldEvent,
  ScaffoldRequest,
  TargetRunRequest,
} from '../shared/types.ts';
import type { Event as SupervisorEvent } from '../../protocol/v1/typescript/index.ts';

const api: ElectronAPI = {
  importFile: () => ipcRenderer.invoke(IPC_CHANNELS.fileImport),

  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.fileSave, filePath, content),

  importEnvironment: () => ipcRenderer.invoke(IPC_CHANNELS.environmentImport),

  environmentStart: (configPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.environmentStart, configPath),

  environmentCancelStart: () => ipcRenderer.invoke(IPC_CHANNELS.environmentCancelStart),

  environmentStop: (configPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.environmentStop, configPath),

  onEnvironmentEvent: (listener: (event: EnvironmentEvent) => void) => {
    const handler = (_event: IpcRendererEvent, payload: EnvironmentEvent) => listener(payload);
    ipcRenderer.on(IPC_CHANNELS.environmentEvent, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.environmentEvent, handler);
  },

  supervisorExecute: (runId: string, entryPoint: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.supervisorExecute, runId, entryPoint),

  supervisorCancel: (runId: string, configPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.supervisorCancel, runId, configPath),

  runTargetSuite: (request: TargetRunRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.suiteRunTarget, request),

  runCppTarget: (request: TargetRunRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.suiteRunCppTarget, request),

  cancelCppTarget: () => ipcRenderer.invoke(IPC_CHANNELS.suiteCancelCppTarget),

  runLocalSuite: (runId: string, entryPoint: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.suiteRunLocal, runId, entryPoint),

  cancelLocalSuite: (runId: string) => ipcRenderer.invoke(IPC_CHANNELS.suiteCancelLocal, runId),

  onSupervisorEvent: (listener: (event: SupervisorEvent) => void) => {
    const handler = (_event: IpcRendererEvent, payload: SupervisorEvent) => listener(payload);
    ipcRenderer.on(IPC_CHANNELS.supervisorEvent, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.supervisorEvent, handler);
  },

  pickRepoDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.repoPickDirectory),

  analyzeRepo: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.repoAnalyze, repoPath),

  scaffoldRepo: (request: ScaffoldRequest) => ipcRenderer.invoke(IPC_CHANNELS.repoScaffold, request),

  cancelScaffoldRepo: () => ipcRenderer.invoke(IPC_CHANNELS.repoCancelScaffold),

  onRepoScaffoldEvent: (listener: (event: RepoScaffoldEvent) => void) => {
    const handler = (_event: IpcRendererEvent, payload: RepoScaffoldEvent) => listener(payload);
    ipcRenderer.on(IPC_CHANNELS.repoScaffoldEvent, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.repoScaffoldEvent, handler);
  },

  loadState: () => ipcRenderer.invoke(IPC_CHANNELS.stateLoad),

  saveState: (state: PersistedState) => ipcRenderer.invoke(IPC_CHANNELS.stateSave, state),

  deleteFileFromDisk: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.fsDeleteFile, filePath),
};

contextBridge.exposeInMainWorld('electron', api);
