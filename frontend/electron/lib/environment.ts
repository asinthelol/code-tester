import { dialog } from 'electron';
import type { BrowserWindow, OpenDialogOptions } from 'electron';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import type { EnvironmentEvent, IntegrationEnvironment } from '../../src/shared/lib/types.ts';
import { lineBuffered } from './ndjson.ts';
import { parseEnvironmentConfig } from './parseEnvironmentConfig.ts';

export { parseEnvironmentConfig };



const DEFAULT_TIMEOUT_MS = 60_000;

let activeUp: ChildProcess | null = null;

const importDialogOptions: OpenDialogOptions = {
  properties: ['openFile'],
  filters: [
    { name: 'Compose file', extensions: ['yml', 'yaml'] },
    { name: 'All Files', extensions: ['*'] },
  ],
};

export async function importEnvironment(
  window: BrowserWindow | null
): Promise<IntegrationEnvironment | null> {
  const { canceled, filePaths } = window
    ? await dialog.showOpenDialog(window, importDialogOptions)
    : await dialog.showOpenDialog(importDialogOptions);

  if (canceled || filePaths.length === 0) {
    return null;
  }

  return parseEnvironmentConfig(filePaths[0]);
}

function friendlyDockerError(error: NodeJS.ErrnoException): string {
  if (error.code === 'ENOENT') {
    return 'Docker CLI not found. Is Docker Desktop installed and running?';
  }
  return error.message;
}

export async function startEnvironment(
  configPath: string,
  onEvent: (event: EnvironmentEvent) => void,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<void> {
  const child = spawn(
    'docker',
    ['compose', '-f', configPath, 'up', '-d', '--wait'],
    { shell: false, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  activeUp = child;

  const recentLines: string[] = [];
  const emitLine = lineBuffered((message) => {
    recentLines.push(message);
    if (recentLines.length > 5) recentLines.shift();
    onEvent({ type: 'compose.status', message });
  });
  child.stdout?.on('data', emitLine);
  child.stderr?.on('data', emitLine);

  let settled = false;
  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    child.kill();
    onEvent({ type: 'environment.failed', reason: 'timeout' });
  }, timeoutMs);

  await new Promise<void>((resolve) => {
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      onEvent({
        type: 'environment.failed',
        reason: 'error',
        message: friendlyDockerError(error),
      });
      resolve();
    });

    child.on('exit', (exitCode, signal) => {
      if (activeUp === child) activeUp = null;
      if (settled) {
        resolve();
        return;
      }
      settled = true;
      clearTimeout(timeout);

      if (signal) {
        onEvent({ type: 'environment.failed', reason: 'cancelled' });
      } else if (exitCode === 0) {
        onEvent({ type: 'environment.ready' });
      } else {
        onEvent({
          type: 'environment.failed',
          reason: 'error',
          message: recentLines.at(-1) ?? `docker compose up exited with code ${exitCode}`,
        });
      }
      resolve();
    });
  });
}

export function cancelStart(): void {
  activeUp?.kill();
}

export async function stopEnvironment(
  configPath: string,
  onEvent?: (event: EnvironmentEvent) => void
): Promise<void> {
  await new Promise<void>((resolve) => {
    const child = spawn('docker', ['compose', '-f', configPath, 'down'], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (onEvent) {
      const emitLine = lineBuffered((message) => onEvent({ type: 'compose.status', message }));
      child.stdout?.on('data', emitLine);
      child.stderr?.on('data', emitLine);
    }

    child.on('exit', () => {
      onEvent?.({ type: 'environment.stopped' });
      resolve();
    });
    child.on('error', (error) => {
      onEvent?.({ type: 'compose.status', message: friendlyDockerError(error) });
      resolve();
    });
  });
}
