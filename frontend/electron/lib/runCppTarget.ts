import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { lineBuffered } from './ndjson.ts';
import { buildCppSource, synthesizeDockerTarget, synthesizeLocalTarget } from './synthesizeTarget.ts';
import type { SynthesizedSuite } from './synthesizeTarget.ts';
import type { TargetRunRequest } from '../../shared/types.ts';
import type { Event as SuiteEvent } from '../../../protocol/v1/typescript/index.ts';



let activeChild: ChildProcess | null = null;
let cancelledByUs = false;

export function cancelCppTarget(): void {
  cancelledByUs = true;
  activeChild?.kill();
}

function runChildCollectingStderr(
  command: string,
  args: string[],
  cwd?: string
): Promise<{ exitCode: number | null; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    activeChild = child;
    let stderr = '';

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString('utf-8');
    });
    child.on('exit', (exitCode) => {
      if (activeChild === child) activeChild = null;
      resolve({ exitCode, stderr });
    });
    child.on('error', (error) => {
      if (activeChild === child) activeChild = null;
      resolve({ exitCode: null, stderr: error.message });
    });
  });
}

interface ProgramRunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  resultLine: string | null;
  stderrText: string;
}

// The synthesized main() couts the tested function's return value as its last line, then exits.
// So the last stdout line is the result.
function runAndCaptureResult(
  command: string,
  args: string[],
  cwd: string | undefined,
  runId: string,
  testId: string,
  onEvent: (event: SuiteEvent) => void
): Promise<ProgramRunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    activeChild = child;
    let pendingLine: string | null = null;
    let stderrText = '';

    child.stdout?.on(
      'data',
      lineBuffered((line) => {
        if (pendingLine !== null) {
          onEvent({ protocolVersion: 1, runId, type: 'test.stdout', testId, chunk: pendingLine });
        }
        pendingLine = line;
      })
    );
    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString('utf-8');
      stderrText += text;
      onEvent({ protocolVersion: 1, runId, type: 'test.stderr', testId, chunk: text });
    });

    child.on('exit', (exitCode, signal) => {
      if (activeChild === child) activeChild = null;
      resolve({ exitCode, signal, resultLine: pendingLine, stderrText });
    });
    child.on('error', (error) => {
      if (activeChild === child) activeChild = null;
      resolve({ exitCode: null, signal: null, resultLine: pendingLine, stderrText: stderrText || error.message });
    });
  });
}

// std::cout prints bool as 1/0  and prints a double like 42.0 as "42"
function compareResult(rawValue: string, expected: unknown): boolean {
  if (typeof expected === 'boolean') return rawValue === (expected ? '1' : '0');
  if (typeof expected === 'number') return Number(rawValue) === expected;
  return rawValue === String(expected);
}

function finalizeTestResult(
  runId: string,
  testId: string,
  result: ProgramRunResult,
  hasExpected: boolean,
  expected: unknown,
  durationMs: number,
  onEvent: (event: SuiteEvent) => void
): void {
  if (cancelledByUs) {
    onEvent({ protocolVersion: 1, runId, type: 'run.aborted' });
    return;
  }

  const { exitCode, signal, resultLine, stderrText } = result;
  if (exitCode !== 0 || signal || resultLine === null) {
    const reason = signal
      ? `Program terminated by signal ${signal}`
      : stderrText.trim() || `program exited with code ${exitCode}`;
    onEvent({ protocolVersion: 1, runId, type: 'test.finished', testId, status: 'errored', durationMs, error: reason });
    onEvent({ protocolVersion: 1, runId, type: 'run.completed' });
    return;
  }

  const passed = !hasExpected || compareResult(resultLine, expected);
  onEvent({
    protocolVersion: 1,
    runId,
    type: 'test.finished',
    testId,
    status: passed ? 'passed' : 'failed',
    durationMs,
    ...(passed ? {} : { error: `expected ${JSON.stringify(expected)}, got ${resultLine}` }),
  });
  onEvent({ protocolVersion: 1, runId, type: 'run.completed' });
}

async function runLocally(
  runId: string,
  synthesized: SynthesizedSuite,
  testId: string,
  hasExpected: boolean,
  expected: unknown,
  onEvent: (event: SuiteEvent) => void
): Promise<void> {
  const entryPointAbsPath = path.join(synthesized.suiteRoot, synthesized.entryPoint);
  const outputPath = path.join(synthesized.suiteRoot, process.platform === 'win32' ? 'a.exe' : 'a.out');

  const compile = await runChildCollectingStderr('g++', [entryPointAbsPath, '-o', outputPath], synthesized.suiteRoot);
  if (cancelledByUs) {
    onEvent({ protocolVersion: 1, runId, type: 'run.aborted' });
    return;
  }
  if (compile.exitCode !== 0) {
    onEvent({
      protocolVersion: 1,
      runId,
      type: 'run.failed',
      reason: compile.stderr.trim() || `g++ exited with code ${compile.exitCode}`,
    });
    return;
  }

  onEvent({
    protocolVersion: 1,
    runId,
    type: 'suite.discovered',
    suite: { id: crypto.randomUUID(), name: synthesized.entryPoint },
    tests: [{ id: testId, name: 'main' }],
  });
  onEvent({ protocolVersion: 1, runId, type: 'test.started', testId });

  const start = Date.now();
  const result = await runAndCaptureResult(outputPath, [], synthesized.suiteRoot, runId, testId, onEvent);
  finalizeTestResult(runId, testId, result, hasExpected, expected, Date.now() - start, onEvent);
}

async function runInDocker(
  runId: string,
  configPath: string,
  synthesized: SynthesizedSuite,
  testId: string,
  hasExpected: boolean,
  expected: unknown,
  onEvent: (event: SuiteEvent) => void
): Promise<void> {
  const remoteEntryPoint = `/suite/${synthesized.entryPoint}`;
  const remoteBinary = `/tmp/ct-${crypto.randomUUID()}`;

  const compile = await runChildCollectingStderr('docker', [
    'compose',
    '-f',
    configPath,
    'exec',
    '-T',
    'supervisor',
    'g++',
    remoteEntryPoint,
    '-o',
    remoteBinary,
  ]);
  if (cancelledByUs) {
    onEvent({ protocolVersion: 1, runId, type: 'run.aborted' });
    return;
  }
  if (compile.exitCode !== 0) {
    onEvent({
      protocolVersion: 1,
      runId,
      type: 'run.failed',
      reason: compile.stderr.trim() || `g++ exited with code ${compile.exitCode}`,
    });
    return;
  }

  onEvent({
    protocolVersion: 1,
    runId,
    type: 'suite.discovered',
    suite: { id: crypto.randomUUID(), name: synthesized.entryPoint },
    tests: [{ id: testId, name: 'main' }],
  });
  onEvent({ protocolVersion: 1, runId, type: 'test.started', testId });

  const start = Date.now();
  const result = await runAndCaptureResult(
    'docker',
    ['compose', '-f', configPath, 'exec', '-T', 'supervisor', remoteBinary],
    undefined,
    runId,
    testId,
    onEvent
  );
  finalizeTestResult(runId, testId, result, hasExpected, expected, Date.now() - start, onEvent);

  void runChildCollectingStderr('docker', ['compose', '-f', configPath, 'exec', '-T', 'supervisor', 'rm', '-f', remoteBinary]);
}

export async function runCppTarget(
  request: TargetRunRequest,
  onEvent: (event: SuiteEvent) => void
): Promise<void> {
  cancelledByUs = false;
  const { runId, testName, target, sourceContent, extension, environmentPath } = request;

  onEvent({ protocolVersion: 1, runId, type: 'run.started' });

  let expected: unknown;
  const hasExpected = target.expectedJson.trim() !== '';
  if (hasExpected) {
    try {
      expected = JSON.parse(target.expectedJson);
    } catch (error) {
      onEvent({
        protocolVersion: 1,
        runId,
        type: 'run.failed',
        reason: `Invalid expected value: ${(error as Error).message}`,
      });
      return;
    }
    if (expected !== null && typeof expected === 'object') {
      onEvent({
        protocolVersion: 1,
        runId,
        type: 'run.failed',
        reason: 'C++ targets only support number/string/boolean expected values, not arrays or objects.',
      });
      return;
    }
  }

  let synthesized: SynthesizedSuite;
  try {
    synthesized = environmentPath
      ? await synthesizeDockerTarget(sourceContent, testName, target, extension, environmentPath, buildCppSource)
      : await synthesizeLocalTarget(sourceContent, testName, target, extension, buildCppSource);
  } catch (error) {
    onEvent({ protocolVersion: 1, runId, type: 'run.failed', reason: (error as Error).message });
    return;
  }

  const testId = crypto.randomUUID();

  try {
    if (environmentPath) {
      await runInDocker(runId, environmentPath, synthesized, testId, hasExpected, expected, onEvent);
    } else {
      await runLocally(runId, synthesized, testId, hasExpected, expected, onEvent);
    }
  } finally {
    await synthesized.cleanup();
  }
}
