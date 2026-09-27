import type { Dispatch, SetStateAction } from 'react';
import type { ImportedFile } from '../../../shared/types';



function upsertByPath<T extends { path: string }>(list: T[], item: T) {
  const existingIndex = list.findIndex((f) => f.path === item.path);
  if (existingIndex === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[existingIndex] = item;
  return next;
}

function replaceByPath<T extends { path: string }>(list: T[], oldPath: string, updated: T) {
  return list.map((item) => (item.path === oldPath ? updated : item));
}

export function useFileActions(
  setFiles: Dispatch<SetStateAction<ImportedFile[]>>,
  activePath: string | null,
  setActivePath: Dispatch<SetStateAction<string | null>>
) {
  const handleImport = (file: ImportedFile) => {
    setFiles((prev) => upsertByPath(prev, file));
    setActivePath(file.path);
  };

  const saveFileContent = async (file: ImportedFile, content: string) => {
    await window.electron.saveFile(file.path, content);
    const updated: ImportedFile = { ...file, content };
    setFiles((prev) => replaceByPath(prev, file.path, updated));
  };

  const handleDeleteFile = async (file: ImportedFile, deleteFromDisk: boolean) => {
    if (deleteFromDisk) await window.electron.deleteFileFromDisk(file.path);
    setFiles((prev) => prev.filter((f) => f.path !== file.path));
    if (activePath === file.path) setActivePath(null);
  };

  return { handleImport, saveFileContent, handleDeleteFile };
}
