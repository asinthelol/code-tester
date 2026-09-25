import { useEffect, useState } from 'react';
import type { Event as SupervisorEvent } from '../../../../../protocol/v1/typescript/index.ts';

interface SuiteRunPanelProps {
  configPath: string;
  testName: string;
  entryPoint: string;
}

type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'errored';
type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'aborted';

interface TestState {
  name: string;
  status: TestStatus;
  durationMs?: number;
  error?: string;
  output: string[];
}

const TEST_STATUS_DOT: Record<TestStatus, string> = {
  pending: 'bg-neutral-400',
  running: 'bg-amber-400',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  errored: 'bg-red-500',
};

function SuiteRunPanel({ configPath, testName, entryPoint }: SuiteRunPanelProps) {
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [runFailedReason, setRunFailedReason] = useState<string | null>(null);
  const [testOrder, setTestOrder] = useState<string[]>([]);
  const [tests, setTests] = useState<Record<string, TestState>>({});

  useEffect(() => {
    const unsubscribe = window.electron.onSupervisorEvent((event: SupervisorEvent) => {
      if (!runId || event.runId !== runId) return;

      switch (event.type) {
        case 'suite.discovered': {
          const order = event.tests.map((t) => t.id);
          setTestOrder(order);
          setTests(
            Object.fromEntries(
              event.tests.map((t) => [t.id, { name: t.name, status: 'pending', output: [] }])
            )
          );
          break;
        }
        case 'test.started':
          setTests((prev) => ({
            ...prev,
            [event.testId]: { ...prev[event.testId], status: 'running' },
          }));
          break;
        case 'test.stdout':
        case 'test.stderr':
          setTests((prev) => ({
            ...prev,
            [event.testId]: {
              ...prev[event.testId],
              output: [...(prev[event.testId]?.output ?? []), event.chunk],
            },
          }));
          break;
        case 'test.finished':
          setTests((prev) => ({
            ...prev,
            [event.testId]: {
              ...prev[event.testId],
              status: event.status,
              durationMs: event.durationMs,
              error: event.error,
            },
          }));
          break;
        case 'run.completed':
          setRunStatus('completed');
          break;
        case 'run.failed':
          setRunStatus('failed');
          setRunFailedReason(event.reason);
          break;
        case 'run.aborted':
          setRunStatus('aborted');
          break;
      }
    });

    return unsubscribe;
  }, [runId]);

  const handleRun = async () => {
    const newRunId = crypto.randomUUID();
    setRunId(newRunId);
    setRunStatus('running');
    setRunFailedReason(null);
    setTestOrder([]);
    setTests({});
    await window.electron.supervisorExecute(newRunId, entryPoint);
  };

  const handleCancel = async () => {
    if (!runId) return;
    await window.electron.supervisorCancel(runId, configPath);
  };

  const isRunning = runStatus === 'running';

  return (
    <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{testName}</div>
          <div className="font-mono text-xs text-neutral-500">{entryPoint}</div>
        </div>
        <button
          type="button"
          onClick={isRunning ? handleCancel : handleRun}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isRunning ? 'Cancel' : 'Run'}
        </button>
      </div>

      {runFailedReason && (
        <p className="mt-2 text-xs text-red-500">Run failed: {runFailedReason}</p>
      )}

      {testOrder.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {testOrder.map((testId) => {
            const test = tests[testId];
            if (!test) return null;
            return (
              <li key={testId} className="flex items-start gap-2 text-sm">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TEST_STATUS_DOT[test.status]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-neutral-900 dark:text-neutral-100">{test.name}</span>
                    {test.durationMs !== undefined && (
                      <span className="text-xs text-neutral-500">{test.durationMs}ms</span>
                    )}
                  </div>
                  {test.error && <p className="text-xs text-red-500">{test.error}</p>}
                  {test.output.length > 0 && (
                    <pre className="mt-1 rounded bg-[#171717] px-2 py-1 font-mono text-xs text-neutral-300">
                      {test.output.join('')}
                    </pre>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SuiteRunPanel;
