import type { ImportedFile, IntegrationEnvironment, Repo, Test } from '../../../shared/types';

export interface FunctionInfo {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
}

export type EnvironmentStatus =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'failed'
  | 'stopping'
  | 'stopped';

export type SuiteTestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'errored';
export type SuiteRunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'aborted';

export interface SuiteTestState {
  name: string;
  status: SuiteTestStatus;
  durationMs?: number;
  error?: string;
  output: string[];
}

export interface SuiteRun {
  runId: string;
  status: SuiteRunStatus;
  failedReason: string | null;
  testOrder: string[];
  tests: Record<string, SuiteTestState>;
}

// The renderer-only "which entity is queued for the confirm-delete modal"
// state -- never crosses IPC, so it lives here rather than in shared/types.
export type PendingDelete =
  | { kind: 'file'; item: ImportedFile }
  | { kind: 'test'; item: Test }
  | { kind: 'environment'; item: IntegrationEnvironment }
  | { kind: 'repo'; item: Repo };
