import { useEffect, useRef, useState } from 'react';
import AddIntegrationTestModal from '../AddIntegrationTestModal/AddIntegrationTestModal';
import SuiteRunPanel from '../SuiteRunPanel/SuiteRunPanel';
import type {
  EnvironmentEvent,
  IntegrationEnvironment,
  IntegrationTest,
} from '../../../shared/lib/types';

interface EnvironmentDetailProps {
  environment: IntegrationEnvironment;
  integrationTests: IntegrationTest[];
  onAddIntegrationTest: (test: { name: string; entryPoint: string }) => void;
}

type Status = 'idle' | 'starting' | 'ready' | 'failed' | 'stopping' | 'stopped';

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Not started',
  starting: 'Starting…',
  ready: 'Ready',
  failed: 'Failed',
  stopping: 'Stopping…',
  stopped: 'Stopped',
};

const STATUS_DOT: Record<Status, string> = {
  idle: 'bg-neutral-400',
  starting: 'bg-amber-400',
  ready: 'bg-green-500',
  failed: 'bg-red-500',
  stopping: 'bg-amber-400',
  stopped: 'bg-neutral-400',
};

function EnvironmentDetail({
  environment,
  integrationTests,
  onAddIntegrationTest,
}: EnvironmentDetailProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = window.electron.onEnvironmentEvent((event: EnvironmentEvent) => {
      switch (event.type) {
        case 'compose.status':
          setLog((prev) => [...prev, event.message]);
          break;
        case 'environment.ready':
          setStatus('ready');
          break;
        case 'environment.failed':
          setStatus('failed');
          setLog((prev) => [
            ...prev,
            `Failed (${event.reason})${event.message ? `: ${event.message}` : ''}`,
          ]);
          break;
        case 'environment.stopped':
          setStatus('stopped');
          break;
      }
    });

    return unsubscribe;
  }, [environment.path]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const handleStart = async () => {
    setStatus('starting');
    setLog([]);
    await window.electron.environmentStart(environment.path);
  };

  const handleStop = async () => {
    setStatus('stopping');
    await window.electron.environmentStop(environment.path);
  };

  const isBusy = status === 'starting' || status === 'stopping';

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-2 text-sm text-neutral-500 dark:border-neutral-700">
        <span className="truncate">{environment.path}</span>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={status === 'ready' || status === 'starting' ? handleStop : handleStart}
            disabled={isBusy}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {status === 'ready' ? 'Stop' : status === 'starting' ? 'Cancel' : 'Start'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
        <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{STATUS_LABEL[status]}</span>
      </div>

      <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
        <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Services</div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {environment.services.map((service) => (
            <li
              key={service}
              className="rounded-full border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
            >
              {service}
            </li>
          ))}
        </ul>
      </div>

      {status === 'ready' && (
        <>
          <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Integration Tests
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
              >
                Add
              </button>
            </div>

            {integrationTests.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No integration tests yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {integrationTests.map((test) => (
                  <li key={test.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTestId(test.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                        test.id === selectedTestId
                          ? 'bg-neutral-200 dark:bg-neutral-800'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <span className="text-neutral-900 dark:text-neutral-100">{test.name}</span>
                      <span className="ml-2 font-mono text-xs text-neutral-500">
                        {test.entryPoint}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {integrationTests
            .filter((test) => test.id === selectedTestId)
            .map((test) => (
              <SuiteRunPanel
                key={test.id}
                configPath={environment.path}
                testName={test.name}
                entryPoint={test.entryPoint}
              />
            ))}

          <AddIntegrationTestModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdd={onAddIntegrationTest}
          />
        </>
      )}

      <div ref={logRef} className="min-h-0 flex-1 overflow-auto bg-[#171717] px-4 py-3 font-mono text-xs text-neutral-300">
        {log.length === 0 ? (
          <p className="text-neutral-500">No output yet.</p>
        ) : (
          log.map((line, index) => <div key={index}>{line}</div>)
        )}
      </div>
    </div>
  );
}

export default EnvironmentDetail;
