import { MdOutlineDelete, MdOutlineDns } from 'react-icons/md';
import type { IntegrationEnvironment } from '../../../../shared/types';

interface EnvironmentsPanelProps {
  environments: IntegrationEnvironment[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDelete: (environment: IntegrationEnvironment) => void;
}

function EnvironmentsPanel({ environments, activePath, onSelect, onDelete }: EnvironmentsPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Environments
      </div>
      <ul className="flex-1 overflow-auto">
        {environments.map((env) => (
          <li
            key={env.path}
            className={`group flex w-full items-center ${
              env.path === activePath
                ? 'bg-neutral-200 dark:bg-neutral-800'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(env.path)}
              title={env.path}
              className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 text-left text-sm"
            >
              <MdOutlineDns className="size-4 shrink-0" />
              <span className="truncate">{env.name}</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(env)}
              title="Delete environment"
              aria-label={`Delete ${env.name}`}
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

export default EnvironmentsPanel;
