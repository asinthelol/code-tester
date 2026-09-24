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
}

export interface TestItem extends ImportedFile {
  target: TestTarget | null;
}

export type RunEvent =
  | { type: 'started' }
  | { type: 'stdout'; chunk: string }
  | { type: 'stderr'; chunk: string }
  | { type: 'exit'; exitCode: number | null; status: 'passed' | 'failed' }
  | { type: 'error'; message: string };
