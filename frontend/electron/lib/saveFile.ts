import { dialog } from 'electron';
import type { BrowserWindow, SaveDialogOptions } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

const filters: SaveDialogOptions['filters'] = [
  {
    name: 'Code',
    extensions: [
      'js', 'jsx', 'ts', 'tsx', 'py', 'go', 'rs', 'java',
      'c', 'cpp', 'h', 'hpp', 'cs', 'rb', 'php',
    ],
  },
  { name: 'All Files', extensions: ['*'] },
];

export async function saveFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function saveFileAs(
  window: BrowserWindow | null,
  content: string,
  suggestedName: string
): Promise<{ path: string; name: string } | null> {
  const options: SaveDialogOptions = { defaultPath: suggestedName, filters };
  const { canceled, filePath } = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options);

  if (canceled || !filePath) {
    return null;
  }

  await fs.writeFile(filePath, content, 'utf-8');

  return { path: filePath, name: path.basename(filePath) };
}
