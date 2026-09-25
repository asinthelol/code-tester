export interface ImportedFile {
  path: string;
  name: string;
  content: string;
}

export interface FunctionInfo {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
}

export interface TestTarget {
  filePath: string;
  functionName: string;
  startLine: number;
  endLine: number;
  argsJson: string;
  expectedJson: string;
}

export interface TestItem {
  id: string;
  name: string;
  target: TestTarget | null;
}

export interface RunRequest {
  sourceContent: string;
  sourceExtension: string;
  functionName: string;
  argsJson: string;
  expectedJson: string;
}

export type RunEvent =
  | { type: 'started' }
  | { type: 'stdout'; chunk: string }
  | { type: 'stderr'; chunk: string }
  | { type: 'result'; actual: unknown; expected: unknown; hasExpected: boolean; passed: boolean }
  | { type: 'exit'; exitCode: number | null; status: 'passed' | 'failed' }
  | { type: 'error'; message: string };

export interface IntegrationEnvironment {
  path: string;
  name: string;
  services: string[];
}

export type EnvironmentEvent =
  | { type: 'compose.status'; message: string }
  | { type: 'environment.ready' }
  | { type: 'environment.failed'; reason: 'timeout' | 'error' | 'cancelled'; message?: string }
  | { type: 'environment.stopped' };

export interface IntegrationTest {
  id: string;
  name: string;
  environmentPath: string;
  entryPoint: string;
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
