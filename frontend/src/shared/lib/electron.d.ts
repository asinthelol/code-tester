import type { ImportedFile, RunEvent } from './types';

declare global {
  interface Window {
    electron: {
      importFile: () => Promise<ImportedFile | null>;
      runStart: (filePath: string) => Promise<void>;
      runStop: () => Promise<void>;
      onRunEvent: (listener: (event: RunEvent) => void) => () => void;
    };
  }
}

export {};
