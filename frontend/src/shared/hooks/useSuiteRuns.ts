import { useEffect, useRef, useState } from 'react';
import type { SuiteRun } from '../lib/types';



export function useSuiteRuns() {
  const [suiteRuns, setSuiteRuns] = useState<Record<string, SuiteRun>>({});
  const runIdToTestId = useRef<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = window.electron.onSupervisorEvent((event) => {
      const testId = runIdToTestId.current[event.runId];
      if (!testId) return;

      setSuiteRuns((prev) => {
        const run = prev[testId];
        if (!run) return prev;

        switch (event.type) {
          case 'suite.discovered': {
            const testOrder = event.tests.map((t) => t.id);
            const tests = Object.fromEntries(
              event.tests.map((t) => [t.id, { name: t.name, status: 'pending' as const, output: [] }])
            );
            return { ...prev, [testId]: { ...run, testOrder, tests } };
          }
          case 'test.started':
            return {
              ...prev,
              [testId]: {
                ...run,
                tests: {
                  ...run.tests,
                  [event.testId]: { ...run.tests[event.testId], status: 'running' },
                },
              },
            };
          case 'test.stdout':
          case 'test.stderr':
            return {
              ...prev,
              [testId]: {
                ...run,
                tests: {
                  ...run.tests,
                  [event.testId]: {
                    ...run.tests[event.testId],
                    output: [...(run.tests[event.testId]?.output ?? []), event.chunk],
                  },
                },
              },
            };
          case 'test.finished':
            return {
              ...prev,
              [testId]: {
                ...run,
                tests: {
                  ...run.tests,
                  [event.testId]: {
                    ...run.tests[event.testId],
                    status: event.status,
                    durationMs: event.durationMs,
                    error: event.error,
                  },
                },
              },
            };
          case 'run.completed':
            return { ...prev, [testId]: { ...run, status: 'completed' } };
          case 'run.failed':
            return { ...prev, [testId]: { ...run, status: 'failed', failedReason: event.reason } };
          case 'run.aborted':
            return { ...prev, [testId]: { ...run, status: 'aborted' } };
          default:
            return prev;
        }
      });
    });
    return unsubscribe;
  }, []);

  const startSuiteRun = (testId: string) => {
    const runId = crypto.randomUUID();
    runIdToTestId.current[runId] = testId;
    setSuiteRuns((prev) => ({
      ...prev,
      [testId]: { runId, status: 'running', failedReason: null, testOrder: [], tests: {} },
    }));
    return runId;
  };

  const removeSuiteRun = (testId: string) => {
    setSuiteRuns((prev) => {
      if (!(testId in prev)) return prev;
      const next = { ...prev };
      delete next[testId];
      return next;
    });
  };

  return { suiteRuns, startSuiteRun, removeSuiteRun };
}
