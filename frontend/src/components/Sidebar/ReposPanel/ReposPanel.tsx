import { MdOutlineDelete, MdOutlineFolder } from 'react-icons/md';
import type { Repo } from '../../../../shared/types';

interface ReposPanelProps {
  repos: Repo[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDelete: (repo: Repo) => void;
}

function ReposPanel({ repos, activePath, onSelect, onDelete }: ReposPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Repos
      </div>
      <ul className="flex-1 overflow-auto">
        {repos.map((repo) => (
          <li
            key={repo.path}
            className={`group flex w-full items-center ${
              repo.path === activePath
                ? 'bg-neutral-200 dark:bg-neutral-800'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(repo.path)}
              title={repo.path}
              className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 text-left text-sm"
            >
              <MdOutlineFolder className="size-4 shrink-0" />
              <span className="truncate">{repo.name}</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(repo)}
              title="Delete repo"
              aria-label={`Delete ${repo.name}`}
              className="flex shrink-0 items-center justify-center p-2 text-neutral-400 opacity-0 hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-500"
            >
              <MdOutlineDelete className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReposPanel;
