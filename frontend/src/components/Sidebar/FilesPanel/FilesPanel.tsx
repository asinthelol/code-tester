import type { ImportedFile } from '../../../shared/lib/types';

interface FilesPanelProps {
  files: ImportedFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
}

function FilesPanel({ files, activePath, onSelect }: FilesPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex justify-center items-center px-3 py-2.5 h-14 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        Files
      </div>
      <ul className="flex-1 overflow-auto">
        {files.map((file) => (
          <li key={file.path}>
            <button
              type="button"
              onClick={() => onSelect(file.path)}
              title={file.path}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                file.path === activePath
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
                  d="M6 2.75h7.5L18.25 7.5V21a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V3.5A.75.75 0 0 1 6 2.75Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 2.75V7.5h5" />
              </svg>
              <span className="truncate">{file.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FilesPanel;
