import type { EnvironmentStatus } from '../../../shared/lib/types';
import type { IntegrationEnvironment, Repo } from '../../../../shared/types';

interface RepoDetailProps {
  repo: Repo;
  environment: IntegrationEnvironment | null;
  environmentStatus: EnvironmentStatus;
  onManageEnvironment: () => void;
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

function RepoDetail({ repo, environment, environmentStatus, onManageEnvironment }: RepoDetailProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-2 dark:border-neutral-700">
        <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {repo.name}
        </span>
      </div>

      <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
        <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Path</div>
        <div className="mt-1 font-mono text-sm text-neutral-900 dark:text-neutral-100">{repo.path}</div>
      </div>

      <div className="border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Environment</div>
          {environment && (
            <button
              type="button"
              onClick={onManageEnvironment}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
            >
              Manage
            </button>
          )}
        </div>

        {environment ? (
          <div className="mt-2 flex items-center gap-2">
            <span className={`size-2 rounded-full ${STATUS_DOT[environmentStatus]}`} />
            <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">{environment.path}</span>
            <span className="text-xs text-neutral-500">— {STATUS_LABEL[environmentStatus]}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No environment linked.</p>
        )}
      </div>

      {environment && environment.services.length > 0 && (
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
      )}
    </div>
  );
}

export default RepoDetail;
