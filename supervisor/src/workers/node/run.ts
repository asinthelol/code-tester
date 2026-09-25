import crypto from 'node:crypto';
import { emitEvent } from '../../protocol.ts';
import { defineTest, getRegistered, resetRegistry } from './suite.ts';
import type { TestDefinition, WorkerContext } from './suite.ts';
import type { NodeRunCommand } from '../../../../protocol/v1/typescript/index.ts';

let cancelled = false;

export function cancelNodeRun(): void {
  cancelled = true;
}

async function withCapturedConsole(
  runId: string,
  testId: string,
  fn: () => Promise<void>
): Promise<void> {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    emitEvent({
      protocolVersion: 1,
      runId,
      type: 'test.stdout',
      testId,
      chunk: `${args.map(String).join(' ')}\n`,
    });
  };
  console.error = (...args: unknown[]) => {
    emitEvent({
      protocolVersion: 1,
      runId,
      type: 'test.stderr',
      testId,
      chunk: `${args.map(String).join(' ')}\n`,
    });
  };

  try {
    await fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

export async function runNodeSuite(command: NodeRunCommand): Promise<void> {
  cancelled = false;
  resetRegistry();
  (globalThis as Record<string, unknown>).defineTest = defineTest;

  const { runId, entryPoint } = command;
  emitEvent({ protocolVersion: 1, runId, type: 'run.started' });

  try {
    await import(`/suite/${entryPoint}`);
  } catch (error) {
    emitEvent({
      protocolVersion: 1,
      runId,
      type: 'run.failed',
      reason: (error as Error).message,
    });
    return;
  }

  const tests = getRegistered();
  const testIds = new Map<TestDefinition, string>();
  const discovered = tests.map((test) => {
    const id = crypto.randomUUID();
    testIds.set(test, id);
    return { id, name: test.name };
  });

  emitEvent({
    protocolVersion: 1,
    runId,
    type: 'suite.discovered',
    suite: { id: crypto.randomUUID(), name: entryPoint },
    tests: discovered,
  });

  const ctx: WorkerContext = {};

  for (const test of tests) {
    if (cancelled) break;

    const testId = testIds.get(test)!;
    emitEvent({ protocolVersion: 1, runId, type: 'test.started', testId });

    const start = Date.now();
    let status: 'passed' | 'failed' | 'errored' = 'passed';
    let error: string | undefined;

    await withCapturedConsole(runId, testId, async () => {
      let result: unknown;
      try {
        result = await test.invoke(ctx);
      } catch (invokeError) {
        status = 'errored';
        error = (invokeError as Error).message;
        return;
      }

      try {
        await test.assert(result, ctx);
      } catch (assertError) {
        status = 'failed';
        error = (assertError as Error).message;
      }
    });

    emitEvent({
      protocolVersion: 1,
      runId,
      type: 'test.finished',
      testId,
      status,
      durationMs: Date.now() - start,
      ...(error ? { error } : {}),
    });
  }

  emitEvent({
    protocolVersion: 1,
    runId,
    type: cancelled ? 'run.aborted' : 'run.completed',
  });
}
