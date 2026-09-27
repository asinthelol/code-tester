import { dialog } from 'electron';
import type { BrowserWindow, OpenDialogOptions } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ImportedFile } from '../../../shared/types.ts';

const dialogOptions: OpenDialogOptions = {
  properties: ['openFile'],
  filters: [
    {
      name: 'Code',
      extensions: [
        'js', 'jsx', 'ts', 'tsx', 'py', 'go', 'rs', 'java',
        'c', 'cpp', 'h', 'hpp', 'cs', 'rb', 'php',
      ],
    },
    { name: 'All Files', extensions: ['*'] },
  ],
};

export async function importFile(
  window: BrowserWindow | null
): Promise<ImportedFile | null> {
  const { canceled, filePaths } = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filePath = filePaths[0];
  const content = await fs.readFile(filePath, 'utf-8');

  return { path: filePath, name: path.basename(filePath), content };
}
