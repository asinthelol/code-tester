import type { ImportedFile } from '../../../shared/lib/types';

interface FilesPanelProps {
  files: ImportedFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDelete: (file: ImportedFile) => void;
}

function FilesPanel({ files, activePath, onSelect, onDelete }: FilesPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Files
      </div>
      <ul className="flex-1 overflow-auto">
        {files.map((file) => (
          <li
            key={file.path}
            className={`group flex w-full items-center ${
              file.path === activePath
                ? 'bg-neutral-200 dark:bg-neutral-800'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(file.path)}
              title={file.path}
              className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 text-left text-sm"
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

            <button
              type="button"
              onClick={() => onDelete(file)}
              title="Delete file"
              aria-label={`Delete ${file.name}`}
              className="flex shrink-0 items-center justify-center p-2 text-neutral-400 opacity-0 hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.75 7.25h14.5M9.75 7.25V5a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1v2.25M18 7.25V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V7.25M10 11v6M14 11v6"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FilesPanel;
