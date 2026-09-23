import type { ImportedFile } from '../../../shared/lib/types';

interface TestsPanelProps {
  tests: ImportedFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
}

function TestsPanel({ tests, activePath, onSelect }: TestsPanelProps) {
  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Tests
      </div>

      {tests.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-3 text-center text-sm text-neutral-500">
          No tests yet
        </div>
      ) : (
        <ul className="flex-1 overflow-auto">
          {tests.map((test) => (
            <li key={test.path}>
              <button
                type="button"
                onClick={() => onSelect(test.path)}
                title={test.path}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  test.path === activePath
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
                    d="M9.5 3h5M10.25 3v5.5L5.75 18a1.5 1.5 0 0 0 1.35 2.15h9.8A1.5 1.5 0 0 0 18.25 18l-4.5-9.5V3"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h9" />
                </svg>
                <span className="truncate">{test.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TestsPanel;
