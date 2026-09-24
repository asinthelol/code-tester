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
