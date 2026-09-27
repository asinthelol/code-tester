import { dialog } from 'electron';
import type { BrowserWindow, OpenDialogOptions } from 'electron';
import path from 'node:path';

const pickDirectoryOptions: OpenDialogOptions = {
  properties: ['openDirectory'],
};

export interface DirectoryPick {
  path: string;
  name: string;
}

export async function pickRepoDirectory(
  window: BrowserWindow | null
): Promise<DirectoryPick | null> {
  const { canceled, filePaths } = window
    ? await dialog.showOpenDialog(window, pickDirectoryOptions)
    : await dialog.showOpenDialog(pickDirectoryOptions);

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const repoPath = filePaths[0];
  return { path: repoPath, name: path.basename(repoPath) };
}
