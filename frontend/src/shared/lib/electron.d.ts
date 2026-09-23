import type { ImportedFile } from './types';

declare global {
  interface Window {
    electron: {
      importFile: () => Promise<ImportedFile | null>;
    };
  }
}

export {};
