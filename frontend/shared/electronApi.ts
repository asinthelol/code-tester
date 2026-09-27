import type {
  EnvironmentEvent,
  ImportedFile,
  IntegrationEnvironment,
  PersistedState,
  RepoAnalysis,
  RepoScaffoldEvent,
  ScaffoldRequest,
  TargetRunRequest,
} from './types.ts';
import type { Event as SupervisorEvent } from '../../protocol/v1/typescript/index.ts';



// Single source of truth for every IPC channel name
// electron/main.ts and electron/preload.ts
export const IPC_CHANNELS = {
  fileImport: 'file:import',
  fileSave: 'file:save',
  environmentImport: 'environment:import',
  environmentStart: 'environment:start',
  environmentCancelStart: 'environment:cancelStart',
  environmentStop: 'environment:stop',
  environmentEvent: 'environment:event',
  supervisorExecute: 'supervisor:execute',
  supervisorCancel: 'supervisor:cancel',
  supervisorEvent: 'supervisor:event',
  suiteRunTarget: 'suite:runTarget',
  suiteRunCppTarget: 'suite:runCppTarget',
  suiteCancelCppTarget: 'suite:cancelCppTarget',
  suiteRunLocal: 'suite:runLocal',
  suiteCancelLocal: 'suite:cancelLocal',
  repoPickDirectory: 'repo:pickDirectory',
  repoAnalyze: 'repo:analyze',
  repoScaffold: 'repo:scaffold',
  repoCancelScaffold: 'repo:cancelScaffold',
  repoScaffoldEvent: 'repo:scaffold:event',
  stateLoad: 'state:load',
  stateSave: 'state:save',
  fsDeleteFile: 'fs:deleteFile',
} as const;

// The full window.electron shape
export interface ElectronAPI {
  importFile: () => Promise<ImportedFile | null>;
  saveFile: (filePath: string, content: string) => Promise<void>;
  importEnvironment: () => Promise<IntegrationEnvironment | null>;
  environmentStart: (configPath: string) => Promise<void>;
  environmentCancelStart: () => Promise<void>;
  environmentStop: (configPath: string) => Promise<void>;
  onEnvironmentEvent: (listener: (event: EnvironmentEvent) => void) => () => void;
  supervisorExecute: (runId: string, entryPoint: string) => Promise<void>;
  supervisorCancel: (runId: string, configPath: string) => Promise<void>;
  runTargetSuite: (request: TargetRunRequest) => Promise<void>;
  runCppTarget: (request: TargetRunRequest) => Promise<void>;
  cancelCppTarget: () => Promise<void>;
  runLocalSuite: (runId: string, entryPoint: string) => Promise<void>;
  cancelLocalSuite: (runId: string) => Promise<void>;
  onSupervisorEvent: (listener: (event: SupervisorEvent) => void) => () => void;
  pickRepoDirectory: () => Promise<{ path: string; name: string } | null>;
  analyzeRepo: (repoPath: string) => Promise<RepoAnalysis>;
  scaffoldRepo: (request: ScaffoldRequest) => Promise<IntegrationEnvironment>;
  cancelScaffoldRepo: () => Promise<void>;
  onRepoScaffoldEvent: (listener: (event: RepoScaffoldEvent) => void) => () => void;
  loadState: () => Promise<PersistedState>;
  saveState: (state: PersistedState) => Promise<void>;
  deleteFileFromDisk: (filePath: string) => Promise<void>;
}
