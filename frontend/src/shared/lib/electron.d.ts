import type {
  EnvironmentEvent,
  ImportedFile,
  IntegrationEnvironment,
  RunEvent,
  RunRequest,
  TargetRunRequest,
} from './types';
import type { Event as SupervisorEvent } from '../../../../protocol/v1/typescript/index.ts';

declare global {
  interface Window {
    electron: {
      importFile: () => Promise<ImportedFile | null>;
      saveFile: (filePath: string, content: string) => Promise<void>;
      runStart: (request: RunRequest) => Promise<void>;
      runStop: () => Promise<void>;
      onRunEvent: (listener: (event: RunEvent) => void) => () => void;
      importEnvironment: () => Promise<IntegrationEnvironment | null>;
      environmentStart: (configPath: string) => Promise<void>;
      environmentCancelStart: () => Promise<void>;
      environmentStop: (configPath: string) => Promise<void>;
      onEnvironmentEvent: (listener: (event: EnvironmentEvent) => void) => () => void;
      supervisorExecute: (runId: string, entryPoint: string) => Promise<void>;
      supervisorCancel: (runId: string, configPath: string) => Promise<void>;
      runTargetSuite: (request: TargetRunRequest) => Promise<void>;
      runLocalSuite: (runId: string, entryPoint: string) => Promise<void>;
      cancelLocalSuite: (runId: string) => Promise<void>;
      onSupervisorEvent: (listener: (event: SupervisorEvent) => void) => () => void;
    };
  }
}

export {};
