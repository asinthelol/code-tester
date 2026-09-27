import { MdOutlineDelete, MdOutlineScience, MdOutlineTune } from 'react-icons/md';
import type { IntegrationEnvironment, Test } from '../../../../shared/types';

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
                      <MdOutlineScience className="size-4 shrink-0" />
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
                        <MdOutlineTune className="size-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDelete(test)}
                      title="Delete test"
                      aria-label={`Delete ${test.name}`}
                      className="flex shrink-0 items-center justify-center p-2 text-neutral-400 opacity-0 hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-500"
                    >
                      <MdOutlineDelete className="size-4" />
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
