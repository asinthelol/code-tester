import { BrowserWindow, ipcMain } from 'electron';
import { analyzeRepo } from '../lib/repo/repoAnalyzer.ts';
import { pickRepoDirectory } from '../lib/fs/pickRepoDirectory.ts';
import { cancelScaffold, scaffoldRepo } from '../lib/repo/scaffoldRepo.ts';
import { IPC_CHANNELS } from '../../shared/electronApi.ts';
import type { ScaffoldRequest } from '../../shared/types.ts';

export function registerRepoHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.repoPickDirectory, (event) =>
    pickRepoDirectory(BrowserWindow.fromWebContents(event.sender))
  );

  ipcMain.handle(IPC_CHANNELS.repoAnalyze, (_event, repoPath: string) => analyzeRepo(repoPath));

  ipcMain.handle(IPC_CHANNELS.repoScaffold, (event, request: ScaffoldRequest) =>
    scaffoldRepo(request, (scaffoldEvent) => event.sender.send(IPC_CHANNELS.repoScaffoldEvent, scaffoldEvent))
  );

  ipcMain.handle(IPC_CHANNELS.repoCancelScaffold, () => cancelScaffold());
}
