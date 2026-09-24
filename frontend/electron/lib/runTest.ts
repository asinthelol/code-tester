import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { RunEvent, RunRequest } from '../../src/shared/lib/types.ts';

const RESULT_MARKER = '\u0001CT_RESULT\u0001';

const COMMANDS: Record<string, string> = {
  js: 'node',
  jsx: 'node',
  py: 'python3',
};

const TIMEOUT_MS = 30_000;

let activeChild: ChildProcess | null = null;
let activeHarnessPath: string | null = null;

export function stopTest(): void {
  activeChild?.kill();
}

function buildHarness(extension: string, request: RunRequest): string {
  const { sourceContent, functionName } = request;

  if (extension === 'js' || extension === 'jsx') {
    return `${sourceContent}

(() => {
  const __args = ${JSON.stringify(JSON.parse(request.argsJson || '[]'))};
  const __result = ${functionName}(...__args);
  console.log(${JSON.stringify(RESULT_MARKER)} + JSON.stringify(__result === undefined ? null : __result));
})();
`;
  }

  if (extension === 'py') {
    return `${sourceContent}

import json as __ct_json
__ct_args = ${JSON.stringify(JSON.parse(request.argsJson || '[]'))}
__ct_result = ${functionName}(*__ct_args)
print(${JSON.stringify(RESULT_MARKER)} + __ct_json.dumps(__ct_result))
`;
  }

  throw new Error(`Unsupported file type ".${extension}"`);
}

async function cleanupHarness(): Promise<void> {
  if (activeHarnessPath) {
    await fs.rm(activeHarnessPath, { force: true });
    activeHarnessPath = null;
  }
}

export async function runTest(
  request: RunRequest,
  onEvent: (event: RunEvent) => void
): Promise<void> {
  stopTest();
  await cleanupHarness();

  const extension = request.sourceExtension.toLowerCase();
  const command = COMMANDS[extension];
  if (!command) {
    onEvent({ type: 'error', message: `Unsupported file type ".${extension}"` });
    return;
  }

  let expected: unknown;
  const hasExpected = request.expectedJson.trim() !== '';

  let harnessSource: string;
  try {
    if (hasExpected) {
      expected = JSON.parse(request.expectedJson);
    }
    harnessSource = buildHarness(extension, request);
  } catch (error) {
    onEvent({
      type: 'error',
      message: `Invalid arguments or expected value: ${(error as Error).message}`,
    });
    return;
  }

  const harnessPath = path.join(
    os.tmpdir(),
    `code-tester-${crypto.randomUUID()}.${extension}`
  );
  await fs.writeFile(harnessPath, harnessSource, 'utf-8');
  activeHarnessPath = harnessPath;

  const child = spawn(command, [harnessPath], {
    cwd: os.tmpdir(),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeChild = child;
  onEvent({ type: 'started' });

  const timeout = setTimeout(() => child.kill(), TIMEOUT_MS);

  let actual: unknown;
  let gotResult = false;
  let stdoutBuffer = '';

  const handleLine = (line: string) => {
    const trimmed = line.replace(/\r?\n?$/, '');
    if (trimmed.startsWith(RESULT_MARKER)) {
      try {
        actual = JSON.parse(trimmed.slice(RESULT_MARKER.length));
        gotResult = true;
      } catch {
        // Malformed result payload; ignore and fall through to exit-code semantics.
      }
      return;
    }
    onEvent({ type: 'stdout', chunk: line });
  };

  const finalize = async () => {
    clearTimeout(timeout);
    if (activeChild === child) {
      activeChild = null;
    }
    await cleanupHarness();
  };

  child.stdout?.on('data', (data: Buffer) => {
    stdoutBuffer += data.toString('utf-8');
    let newlineIndex: number;
    while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
      handleLine(stdoutBuffer.slice(0, newlineIndex + 1));
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    onEvent({ type: 'stderr', chunk: data.toString('utf-8') });
  });

  child.on('error', (error) => {
    onEvent({ type: 'error', message: error.message });
    void finalize();
  });

  child.on('exit', (exitCode) => {
    if (stdoutBuffer) {
      handleLine(stdoutBuffer);
      stdoutBuffer = '';
    }

    if (exitCode === 0 && gotResult) {
      const passed = hasExpected
        ? JSON.stringify(actual) === JSON.stringify(expected)
        : true;
      onEvent({ type: 'result', actual, expected, hasExpected, passed });
      onEvent({ type: 'exit', exitCode, status: passed ? 'passed' : 'failed' });
    } else {
      onEvent({ type: 'exit', exitCode, status: exitCode === 0 ? 'passed' : 'failed' });
    }

    void finalize();
  });
}
