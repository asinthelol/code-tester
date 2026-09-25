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

export interface TestItem extends ImportedFile {
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
