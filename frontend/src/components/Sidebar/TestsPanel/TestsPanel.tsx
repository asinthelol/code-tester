import type { TestItem } from '../../../shared/lib/types';

interface TestsPanelProps {
  tests: TestItem[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onConfigure: (test: TestItem) => void;
}

function TestsPanel({ tests, activePath, onSelect, onConfigure }: TestsPanelProps) {
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
            <li
              key={test.path}
              className={`group flex w-full items-center ${
                test.path === activePath
                  ? 'bg-neutral-200 dark:bg-neutral-800'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(test.path)}
                title={test.path}
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
                    d="M9.5 3h5M10.25 3v5.5L5.75 18a1.5 1.5 0 0 0 1.35 2.15h9.8A1.5 1.5 0 0 0 18.25 18l-4.5-9.5V3"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h9" />
                </svg>
                <span className="truncate">{test.name}</span>
              </button>

              <button
                type="button"
                onClick={() => onConfigure(test)}
                title="Test settings"
                aria-label={`Configure ${test.name}`}
                className="flex shrink-0 items-center justify-center p-2 text-neutral-400 opacity-0 hover:text-neutral-900 group-hover:opacity-100 dark:hover:text-neutral-100"
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
                    d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.1 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10.5a1.65 1.65 0 0 0 1-1.51V2.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8.5a1.65 1.65 0 0 0 1.51 1h.09a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TestsPanel;
