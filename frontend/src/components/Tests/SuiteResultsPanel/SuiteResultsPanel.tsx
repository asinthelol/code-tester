import type { SuiteRun, SuiteTestStatus } from '../../../shared/lib/types';

interface SuiteResultsPanelProps {
  run: SuiteRun | undefined;
}

const TEST_STATUS_DOT: Record<SuiteTestStatus, string> = {
  pending: 'bg-neutral-400',
  running: 'bg-amber-400',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  errored: 'bg-red-500',
};

function SuiteResultsPanel({ run }: SuiteResultsPanelProps) {
  if (!run) return null;

  return (
    <div className="min-h-0 flex-1 overflow-auto px-6 py-3">
      {run.failedReason && <p className="text-xs text-red-500">Run failed: {run.failedReason}</p>}

      {run.testOrder.length > 0 && (
        <ul className="flex flex-col gap-1">
          {run.testOrder.map((testId) => {
            const test = run.tests[testId];
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

export default SuiteResultsPanel;
