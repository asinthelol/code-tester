import type { IntegrationEnvironment } from '../../../shared/lib/types';

interface EnvironmentsPanelProps {
  environments: IntegrationEnvironment[];
  activePath: string | null;
  onSelect: (path: string) => void;
}

function EnvironmentsPanel({ environments, activePath, onSelect }: EnvironmentsPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Environments
      </div>

      {environments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-3 text-center text-sm text-neutral-500">
          No environments yet
        </div>
      ) : (
        <ul className="flex-1 overflow-auto">
          {environments.map((env) => (
            <li key={env.path}>
              <button
                type="button"
                onClick={() => onSelect(env.path)}
                title={env.path}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  env.path === activePath
                    ? 'bg-neutral-200 dark:bg-neutral-800'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="size-4 shrink-0"
                >
                  <rect x="3.5" y="3.5" width="17" height="5.5" rx="1.5" />
                  <rect x="3.5" y="10.75" width="17" height="5.5" rx="1.5" />
                  <rect x="3.5" y="18" width="17" height="2.5" rx="1.25" />
                </svg>
                <span className="truncate">{env.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EnvironmentsPanel;
