import type { IntegrationEnvironment, Test } from '../../../shared/lib/types';

interface TestsPanelProps {
  tests: Test[];
  environments: IntegrationEnvironment[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onConfigure: (test: Test) => void;
  onDelete: (test: Test) => void;
}

function groupTests(tests: Test[], environments: IntegrationEnvironment[]) {
  const groups: { key: string | null; label: string; tests: Test[] }[] = [
    { key: null, label: 'Local', tests: [] },
    ...environments.map((env) => ({ key: env.path, label: env.name, tests: [] as Test[] })),
  ];
  const byKey = new Map(groups.map((g) => [g.key, g]));

  for (const test of tests) {
    let group = byKey.get(test.environmentPath);
    if (!group) {
      group = { key: test.environmentPath, label: test.environmentPath ?? 'Local', tests: [] };
      byKey.set(test.environmentPath, group);
      groups.push(group);
    }
    group.tests.push(test);
  }

  return groups.filter((g) => g.tests.length > 0);
}

function testTitle(test: Test) {
  if (test.spec.kind === 'target') {
    return test.spec.target
      ? `${test.spec.target.functionName} in ${test.spec.target.filePath}`
      : 'No target configured';
  }
  return test.spec.entryPoint;
}

function TestsPanel({ tests, environments, activeId, onSelect, onConfigure, onDelete }: TestsPanelProps) {
  const groups = groupTests(tests, environments);
  const showGroupLabels = groups.length > 1;

  return (
    <div className="flex w-56 flex-col border-r border-neutral-300 dark:border-neutral-700">
      <div className="flex h-14 items-center justify-center border-b border-neutral-300 px-3 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-700">
        Tests
      </div>
        <div className="flex-1 overflow-auto">
          {groups.map((group) => (
            <div key={group.key ?? '__local__'}>
              {showGroupLabels && (
                <div className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-600">
                  {group.label}
                </div>
              )}
              <ul>
                {group.tests.map((test) => (
                  <li
                    key={test.id}
                    className={`group flex w-full items-center ${
                      test.id === activeId
                        ? 'bg-neutral-200 dark:bg-neutral-800'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(test.id)}
                      title={testTitle(test)}
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

                    {test.spec.kind === 'target' && (
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
                    )}

                    <button
                      type="button"
                      onClick={() => onDelete(test)}
                      title="Delete test"
                      aria-label={`Delete ${test.name}`}
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
          ))}
        </div>
    </div>
  );
}

export default TestsPanel;
