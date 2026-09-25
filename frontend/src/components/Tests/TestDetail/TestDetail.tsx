import RunOutputPanel from '../RunOutputPanel/RunOutputPanel';
import type { TestItem } from '../../../shared/lib/types';

interface TestDetailProps {
  test: TestItem;
  runSetupError: string | null;
  onRun: () => void;
  onConfigureTarget: () => void;
}

function TestDetail({ test, runSetupError, onRun, onConfigureTarget }: TestDetailProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-2 dark:border-neutral-700">
        <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {test.name}
        </span>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          {runSetupError && <span className="text-xs text-red-500">{runSetupError}</span>}
          <button
            type="button"
            onClick={onRun}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Run
          </button>
        </div>
      </div>

      <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Target</div>
          <button
            type="button"
            onClick={onConfigureTarget}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
          >
            {test.target ? 'Change' : 'Configure'}
          </button>
        </div>

        {test.target ? (
          <div className="mt-2 flex flex-col gap-1">
            <div className="text-sm">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {test.target.functionName}
              </span>
              <span className="ml-2 text-xs text-neutral-500">{test.target.filePath}</span>
            </div>
            <div className="font-mono text-xs text-neutral-500">args: {test.target.argsJson}</div>
            {test.target.expectedJson && (
              <div className="font-mono text-xs text-neutral-500">
                expected: {test.target.expectedJson}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No target configured yet.</p>
        )}
      </div>

      <RunOutputPanel />
    </div>
  );
}

export default TestDetail;
