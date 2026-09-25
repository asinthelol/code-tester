import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import type { Command, Event } from '../../../protocol/v1/typescript/index.ts';



const CANCEL_GRACE_MS = 5_000;

let attached: ChildProcess | null = null;
let cancelTimer: NodeJS.Timeout | null = null;

function lineBuffered(onLine: (line: string) => void) {
  let buffer = '';
  return (data: Buffer) => {
    buffer += data.toString('utf-8');
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      if (line.trim()) onLine(line);
    }
  };
}

export function attachSupervisor(
  configPath: string,
  onEvent: (event: Event) => void
): void {
  detachSupervisor();

  const child = spawn(
    'docker',
    ['compose', '-f', configPath, 'attach', 'supervisor'],
    { shell: false, stdio: ['pipe', 'pipe', 'pipe'] }
  );
  attached = child;

  const emitLine = lineBuffered((line) => {
    try {
      onEvent(JSON.parse(line) as Event);
    } catch {
      // Not a protocol line (e.g. container boot noise); ignore.
    }
  });
  child.stdout?.on('data', emitLine);
}

export function detachSupervisor(): void {
  if (cancelTimer) {
    clearTimeout(cancelTimer);
    cancelTimer = null;
  }
  attached?.kill();
  attached = null;
}

function sendCommand(command: Command): void {
  attached?.stdin?.write(`${JSON.stringify(command)}\n`);
}

export function executeSuite(runId: string, entryPoint: string): void {
  sendCommand({ protocolVersion: 1, runId, type: 'run', adapter: 'node', entryPoint });
}

export function cancelSuite(
  runId: string,
  configPath: string,
  onGraceTimeout: () => void
): void {
  sendCommand({ protocolVersion: 1, runId, type: 'cancel' });

  cancelTimer = setTimeout(() => {
    cancelTimer = null;
    spawn('docker', ['compose', '-f', configPath, 'kill', 'supervisor']);
    onGraceTimeout();
  }, CANCEL_GRACE_MS);
}

export function clearCancelGrace(): void {
  if (cancelTimer) {
    clearTimeout(cancelTimer);
    cancelTimer = null;
  }
}
