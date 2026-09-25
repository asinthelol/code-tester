import { app } from 'electron';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import type { Command, Event } from '../../../protocol/v1/typescript/index.ts';
import { lineBuffered } from './ndjson.ts';

let worker: ChildProcess | null = null;

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
  worker?.kill();
  worker = null;
}

export function sendLocalCommand(command: Command): void {
  worker?.stdin?.write(`${JSON.stringify(command)}\n`);
}
