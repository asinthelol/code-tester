import type { Repo } from '../../../shared/lib/types';

interface ReposPanelProps {
  repos: Repo[];
  activePath: string | null;
  onSelect: (path: string) => void;
}

function ReposPanel({ repos, activePath, onSelect }: ReposPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Repos
      </div>
        <ul className="flex-1 overflow-auto">
          {repos.map((repo) => (
            <li key={repo.path}>
              <button
                type="button"
                onClick={() => onSelect(repo.path)}
                title={repo.path}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  repo.path === activePath
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.5 6.25A2.25 2.25 0 0 1 5.75 4h3.69a1 1 0 0 1 .79.39l1.31 1.7a1 1 0 0 0 .79.39h6.41a2.25 2.25 0 0 1 2.25 2.25v9.02a2.25 2.25 0 0 1-2.25 2.25H5.75a2.25 2.25 0 0 1-2.25-2.25V6.25Z"
                  />
                </svg>
                <span className="truncate">{repo.name}</span>
              </button>
            </li>
          ))}
        </ul>
    </div>
  );
}

export default ReposPanel;
