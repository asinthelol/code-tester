import SuiteResultsPanel from '../SuiteResultsPanel/SuiteResultsPanel';
import type { EnvironmentStatus, SuiteRun } from '../../../shared/lib/types';
import type { IntegrationEnvironment, Test } from '../../../../shared/types';

interface TestDetailProps {
  test: Test;
  environment: IntegrationEnvironment | null;
  environmentStatus: EnvironmentStatus;
  suiteRun: SuiteRun | undefined;
  runSetupError: string | null;
  onRun: () => void;
  onCancel: () => void;
  onConfigureTarget: () => void;
  onStartEnvironment: () => void;
  onStopEnvironment: () => void;
}

const STATUS_LABEL: Record<EnvironmentStatus, string> = {
  idle: 'Not started',
  starting: 'Starting…',
  ready: 'Ready',
  failed: 'Failed',
  stopping: 'Stopping…',
  stopped: 'Stopped',
};

const STATUS_DOT: Record<EnvironmentStatus, string> = {
  idle: 'bg-neutral-400',
  starting: 'bg-amber-400',
  ready: 'bg-green-500',
  failed: 'bg-red-500',
  stopping: 'bg-amber-400',
  stopped: 'bg-neutral-400',
};

function TestDetail({
  test,
  environment,
  environmentStatus,
  suiteRun,
  runSetupError,
  onRun,
  onCancel,
  onConfigureTarget,
  onStartEnvironment,
  onStopEnvironment,
}: TestDetailProps) {

  const environmentBusy = environmentStatus === 'starting' || environmentStatus === 'stopping';
  const environmentReady = environmentStatus === 'ready';
  const canRunSuite = !environment || environmentReady;
  const isRunning = suiteRun?.status === 'running';

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
            onClick={isRunning ? onCancel : onRun}
            disabled={!canRunSuite}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {isRunning ? 'Cancel' : 'Run'}
          </button>
        </div>
      </div>

      {environment && (
        <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${STATUS_DOT[environmentStatus]}`} />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {environment.name} — {STATUS_LABEL[environmentStatus]}
            </span>
          </div>
          <button
            type="button"
            onClick={environmentReady || environmentStatus === 'starting' ? onStopEnvironment : onStartEnvironment}
            disabled={environmentBusy}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
          >
            {environmentReady ? 'Stop' : environmentStatus === 'starting' ? 'Cancel' : 'Start'}
          </button>
        </div>
      )}

      {test.spec.kind === 'target' && (
        <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Target</div>
            <button
              type="button"
              onClick={onConfigureTarget}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
            >
              {test.spec.target ? 'Change' : 'Configure'}
            </button>
          </div>

          {test.spec.target ? (
            <div className="mt-2 flex flex-col gap-1">
              <div className="text-sm">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {test.spec.target.functionName}
                </span>
                <span className="ml-2 text-xs text-neutral-500">{test.spec.target.filePath}</span>
              </div>
              <div className="font-mono text-xs text-neutral-500">args: {test.spec.target.argsJson}</div>
              {test.spec.target.expectedJson && (
                <div className="font-mono text-xs text-neutral-500">
                  expected: {test.spec.target.expectedJson}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">No target configured yet.</p>
          )}
        </div>
      )}

      {test.spec.kind === 'entryPoint' && (
        <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
          <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Entry point</div>
          <div className="mt-2 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {test.spec.entryPoint}
          </div>
        </div>
      )}

      {environment && !environmentReady ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Start the environment to run this test
        </div>
      ) : (
        <SuiteResultsPanel run={suiteRun} />
      )}
    </div>
  );
}

export default TestDetail;
