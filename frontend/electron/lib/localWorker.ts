import { app } from 'electron';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import type { Command, Event } from '../../../protocol/v1/typescript/index.ts';
import { lineBuffered } from './ndjson.ts';

const CANCEL_GRACE_MS = 5_000;

let worker: ChildProcess | null = null;
let cancelTimer: NodeJS.Timeout | null = null;

function bundlePath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'local-worker.js')
    : path.join(__dirname, '..', '..', '..', 'supervisor', 'dist', 'local.js');
}

export function attachLocalWorker(
  suiteRoot: string,
  onEvent: (event: Event) => void
): void {
  detachLocalWorker();

  const child = spawn('node', [bundlePath(), suiteRoot], {
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  worker = child;

  const emitLine = lineBuffered((line) => {
    try {
      onEvent(JSON.parse(line) as Event);
    } catch {
      // Not a protocol line; ignore.
    }
  });
  child.stdout?.on('data', emitLine);
}

export function detachLocalWorker(): void {
  if (cancelTimer) {
    clearTimeout(cancelTimer);
    cancelTimer = null;
  }
  worker?.kill();
  worker = null;
}

export function sendLocalCommand(command: Command): void {
  worker?.stdin?.write(`${JSON.stringify(command)}\n`);
}

export function cancelLocalSuite(runId: string, onGraceTimeout: () => void): void {
  sendLocalCommand({ protocolVersion: 1, runId, type: 'cancel' });

  cancelTimer = setTimeout(() => {
    cancelTimer = null;
    detachLocalWorker();
    onGraceTimeout();
  }, CANCEL_GRACE_MS);
}

export function clearLocalCancelGrace(): void {
  if (cancelTimer) {
    clearTimeout(cancelTimer);
    cancelTimer = null;
  }
}
