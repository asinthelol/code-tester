import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import type { RunEvent } from '../../src/shared/lib/types.ts';

const COMMANDS: Record<string, string> = {
  js: 'node',
  jsx: 'node',
  py: 'python3',
};

const TIMEOUT_MS = 30_000;

let activeChild: ChildProcess | null = null;

export function stopTest(): void {
  activeChild?.kill();
}

export function runTest(filePath: string, onEvent: (event: RunEvent) => void): void {
  stopTest();

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const command = COMMANDS[ext];
  if (!command) {
    onEvent({ type: 'error', message: `Unsupported file type ".${ext}"` });
    return;
  }

  const child = spawn(command, [filePath], {
    cwd: path.dirname(filePath),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeChild = child;
  onEvent({ type: 'started' });

  const timeout = setTimeout(() => child.kill(), TIMEOUT_MS);

  const finalize = () => {
    clearTimeout(timeout);
    if (activeChild === child) {
      activeChild = null;
    }
  };

  child.stdout?.on('data', (data: Buffer) => {
    onEvent({ type: 'stdout', chunk: data.toString('utf-8') });
  });

  child.stderr?.on('data', (data: Buffer) => {
    onEvent({ type: 'stderr', chunk: data.toString('utf-8') });
  });

  child.on('error', (error) => {
    onEvent({ type: 'error', message: error.message });
    finalize();
  });

  child.on('exit', (exitCode) => {
    onEvent({ type: 'exit', exitCode, status: exitCode === 0 ? 'passed' : 'failed' });
    finalize();
  });
}
