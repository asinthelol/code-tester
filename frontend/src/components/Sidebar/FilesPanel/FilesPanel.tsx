import { MdOutlineDelete, MdOutlineDescription } from 'react-icons/md';
import type { ImportedFile } from '../../../../shared/types';

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
              <MdOutlineDescription className="size-4 shrink-0" />
              <span className="truncate">{file.name}</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(file)}
              title="Delete file"
              aria-label={`Delete ${file.name}`}
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

export default FilesPanel;
