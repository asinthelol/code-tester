import type { ElectronAPI } from '../../../shared/electronApi.ts';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
