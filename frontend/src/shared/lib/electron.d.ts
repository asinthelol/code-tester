import type { ImportedFile, RunEvent, RunRequest } from './types';

declare global {
  interface Window {
    electron: {
      importFile: () => Promise<ImportedFile | null>;
      saveFile: (filePath: string, content: string) => Promise<void>;
      saveFileAs: (
        content: string,
        suggestedName: string
      ) => Promise<{ path: string; name: string } | null>;
      runStart: (request: RunRequest) => Promise<void>;
      runStop: () => Promise<void>;
      onRunEvent: (listener: (event: RunEvent) => void) => () => void;
    };
  }
}

export {};
