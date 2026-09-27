import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitEvent } from '../../protocol.ts';
import type { PythonRunCommand } from '../../../../protocol/v1/typescript/index.ts';




const BRIDGE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'workers',
  'python',
  'ct_bridge.py'
);

// `python3` isn't always what's on PATH
const PYTHON_CANDIDATES = ['python3', 'python', 'py'];
let resolvedPythonCommand: string | null = null;

async function resolvePythonCommand(): Promise<string> {
  if (resolvedPythonCommand) return resolvedPythonCommand;

  for (const candidate of PYTHON_CANDIDATES) {
    const works = await new Promise<boolean>((resolve) => {
      const probe = spawn(candidate, ['--version'], { shell: false, stdio: 'ignore' });
      probe.on('error', () => resolve(false));
      probe.on('exit', (code) => resolve(code === 0));
    });
    if (works) {
      resolvedPythonCommand = candidate;
      return candidate;
    }
  }

  throw new Error(
    `No working Python interpreter found (tried: ${PYTHON_CANDIDATES.join(', ')}). Install Python 3 and make sure it's on PATH.`
  );
}

let activeChild: ChildProcess | null = null;
let cancelledByUs = false;

export function cancelPythonRun(): void {
  cancelledByUs = true;
  activeChild?.kill();
}

interface BridgeLine {
  event: string;
  [key: string]: unknown;
}

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

export async function runPythonSuite(command: PythonRunCommand, suiteRoot: string): Promise<void> {
  cancelledByUs = false;
  const { runId, entryPoint } = command;
  const entryPointAbsPath = path.resolve(suiteRoot, entryPoint);

  emitEvent({ protocolVersion: 1, runId, type: 'run.started' });

  let pythonCommand: string;
  try {
    pythonCommand = await resolvePythonCommand();
  } catch (error) {
    emitEvent({ protocolVersion: 1, runId, type: 'run.failed', reason: (error as Error).message });
    return;
  }

  let sawRunFailed = false;
  let lastStderrLine = '';

  await new Promise<void>((resolve) => {
    const child = spawn(pythonCommand, [BRIDGE_PATH, entryPointAbsPath, suiteRoot], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    activeChild = child;

    const handleLine = (line: string) => {
      let parsed: BridgeLine;
      try {
        parsed = JSON.parse(line);
      } catch {
        return;
      }

      switch (parsed.event) {
        case 'run_failed':
          sawRunFailed = true;
          emitEvent({
            protocolVersion: 1,
            runId,
            type: 'run.failed',
            reason: String(parsed.reason ?? 'Unknown error'),
          });
          break;
        case 'discovered':
          emitEvent({
            protocolVersion: 1,
            runId,
            type: 'suite.discovered',
            suite: { id: crypto.randomUUID(), name: entryPoint },
            tests: parsed.tests as { id: string; name: string }[],
          });
          break;
        case 'test_started':
          emitEvent({ protocolVersion: 1, runId, type: 'test.started', testId: String(parsed.testId) });
          break;
        case 'stdout':
          emitEvent({
            protocolVersion: 1,
            runId,
            type: 'test.stdout',
            testId: String(parsed.testId),
            chunk: String(parsed.chunk),
          });
          break;
        case 'stderr':
          emitEvent({
            protocolVersion: 1,
            runId,
            type: 'test.stderr',
            testId: String(parsed.testId),
            chunk: String(parsed.chunk),
          });
          break;
        case 'test_finished':
          emitEvent({
            protocolVersion: 1,
            runId,
            type: 'test.finished',
            testId: String(parsed.testId),
            status: parsed.status as 'passed' | 'failed' | 'errored',
            durationMs: Number(parsed.durationMs),
            ...(parsed.error ? { error: String(parsed.error) } : {}),
          });
          break;
      }
    };

    child.stdout?.on('data', lineBuffered(handleLine));
    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString('utf-8').trim();
      if (text) lastStderrLine = text;
    });

    child.on('exit', (exitCode, signal) => {
      if (activeChild === child) activeChild = null;

      if (!sawRunFailed) {
        if (cancelledByUs || signal) {
          emitEvent({ protocolVersion: 1, runId, type: 'run.aborted' });
        } else if (exitCode === 0) {
          emitEvent({ protocolVersion: 1, runId, type: 'run.completed' });
        } else {
          emitEvent({
            protocolVersion: 1,
            runId,
            type: 'run.failed',
            reason: lastStderrLine || `${pythonCommand} exited with code ${exitCode}`,
          });
        }
      }
      resolve();
    });

    child.on('error', (error) => {
      if (activeChild === child) activeChild = null;
      emitEvent({ protocolVersion: 1, runId, type: 'run.failed', reason: error.message });
      resolve();
    });
  });
}
