import { useEffect, useRef, useState } from 'react';
import Modal from '../../ui/Modal/Modal';
import type {
  BackingServiceSuggestion,
  IntegrationEnvironment,
  Repo,
  RepoAnalysis,
  ScaffoldRequest,
} from '../../../../shared/types';

interface RepoWizardModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: { repo: Repo; environment: IntegrationEnvironment }) => void;
}

type Step = 'pick' | 'analyzing' | 'confirm' | 'scaffolding' | 'error';

function RepoWizardModal({ open, onClose, onComplete }: RepoWizardModalProps) {
  const [step, setStep] = useState<Step>('pick');
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [backingServices, setBackingServices] = useState<BackingServiceSuggestion[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const reset = () => {
    setStep('pick');
    setAnalysis(null);
    setBackingServices([]);
    setLog([]);
    setErrorMessage(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickDirectory = async () => {
    const picked = await window.electron.pickRepoDirectory();
    if (!picked) return;

    setStep('analyzing');
    try {
      const result = await window.electron.analyzeRepo(picked.path);
      setAnalysis(result);
      setBackingServices(result.backingServices);
      setStep('confirm');
    } catch (error) {
      setErrorMessage((error as Error).message);
      setStep('error');
    }
  };

  const toggleBackingService = (type: BackingServiceSuggestion['type']) => {
    setBackingServices((prev) =>
      prev.map((b) => (b.type === type && b.autoWireable ? { ...b, confirmed: !b.confirmed } : b))
    );
  };

  const handleConfirm = async () => {
    if (!analysis) return;
    setLog([]);
    setStep('scaffolding');

    const unsubscribe = window.electron.onRepoScaffoldEvent((event) => {
      if (event.type === 'scaffold.status') {
        setLog((prev) => [...prev, event.message]);
      } else if (event.type === 'scaffold.buildpacks.status') {
        setLog((prev) => [...prev, `[${event.service}] ${event.message}`]);
      }
    });

    const request: ScaffoldRequest = {
      repoPath: analysis.repoPath,
      repoName: analysis.repoName,
      services: analysis.services,
      backingServices,
    };

    try {
      const environment = await window.electron.scaffoldRepo(request);
      unsubscribe();
      onComplete({
        repo: { path: analysis.repoPath, name: analysis.repoName, environmentPath: environment.path },
        environment,
      });
    } catch (error) {
      unsubscribe();
      setErrorMessage((error as Error).message);
      setStep('error');
    }
  };

  const handleCancelScaffold = () => {
    void window.electron.cancelScaffoldRepo();
  };

  return (
    <Modal open={open} title="Add Repo">
      {step === 'pick' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-500">
            Pick a repository directory. It'll be scanned for buildable services and likely
            backing services.
          </p>
          <button
            type="button"
            onClick={handlePickDirectory}
            className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Choose Repository…
          </button>
        </div>
      )}

      {step === 'analyzing' && (
        <p className="text-sm text-neutral-500">Analyzing repository…</p>
      )}

      {step === 'confirm' && analysis && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Detected services
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {analysis.services.map((svc) => (
                <li key={svc.name} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-900 dark:text-neutral-100">{svc.name}</span>
                  <span className="text-xs text-neutral-500">
                    {svc.buildStrategy === 'dockerfile' ? 'Dockerfile found' : 'will build with buildpacks'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Backing services
            </div>
            {backingServices.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">None detected.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {backingServices.map((b) => (
                  <li key={b.type}>
                    <label
                      className={`flex items-start gap-2 text-sm ${
                        b.autoWireable ? '' : 'opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={b.confirmed}
                        disabled={!b.autoWireable}
                        onChange={() => toggleBackingService(b.type)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {b.type}
                        </span>
                        <span className="ml-1 text-xs text-neutral-500">— {b.detectedVia}</span>
                        {!b.autoWireable && (
                          <span className="block text-xs text-neutral-500">
                            detected, but not supported by the supervisor yet.
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="self-end rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Generate Environment
          </button>
        </div>
      )}

      {step === 'scaffolding' && (
        <div className="flex flex-col gap-3">
          <div
            ref={logRef}
            className="h-48 overflow-auto rounded bg-[#171717] px-3 py-2 font-mono text-xs text-neutral-300"
          >
            {log.length === 0 ? (
              <p className="text-neutral-500">Starting…</p>
            ) : (
              log.map((line, index) => <div key={index}>{line}</div>)
            )}
          </div>
          <button
            type="button"
            onClick={handleCancelScaffold}
            className="self-end rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
          >
            Cancel
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="whitespace-pre-wrap font-mono text-xs text-red-500">{errorMessage}</p>
          {log.length > 0 && (
            <div className="h-48 overflow-auto rounded bg-[#171717] px-3 py-2 font-mono text-xs text-neutral-300">
              {log.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {analysis && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep('confirm');
                }}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default RepoWizardModal;
