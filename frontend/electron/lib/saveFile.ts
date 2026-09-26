import fs from 'node:fs/promises';

export async function saveFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}
