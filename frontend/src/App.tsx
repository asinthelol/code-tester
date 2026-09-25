import { useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import EnvironmentDetail from './components/Environments/EnvironmentDetail/EnvironmentDetail';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardPanel from './components/Sidebar/DashboardPanel/DashboardPanel';
import EnvironmentsPanel from './components/Sidebar/EnvironmentsPanel/EnvironmentsPanel';
import FilesPanel from './components/Sidebar/FilesPanel/FilesPanel';
import ReposPanel from './components/Sidebar/ReposPanel/ReposPanel';
import TestsPanel from './components/Sidebar/TestsPanel/TestsPanel';
import SelectFunctionModal from './components/Tests/SelectFunctionModal/SelectFunctionModal';
import TestDetail from './components/Tests/TestDetail/TestDetail';
import Toolbar from './components/Toolbar/Toolbar';
import type {
  EnvironmentStatus,
  ImportedFile,
  IntegrationEnvironment,
  IntegrationTest,
  SuiteRun,
  TestItem,
  TestTarget,
} from './shared/lib/types';

function upsertByPath<T extends { path: string }>(list: T[], item: T) {
  const existingIndex = list.findIndex((f) => f.path === item.path);
  if (existingIndex === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[existingIndex] = item;
  return next;
}

function replaceByPath<T extends { path: string }>(list: T[], oldPath: string, updated: T) {
  return list.map((item) => (item.path === oldPath ? updated : item));
}

function App() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<IntegrationEnvironment[]>([]);
  const [activeEnvironmentPath, setActiveEnvironmentPath] = useState<string | null>(null);
  const [integrationTests, setIntegrationTests] = useState<IntegrationTest[]>([]);
  const [selectedIntegrationTestId, setSelectedIntegrationTestId] = useState<string | null>(
    null
  );
  const [activeSection, setActiveSection] = useState('Files');
  const [targetPickerFor, setTargetPickerFor] = useState<string | null>(null);
  const [runSetupError, setRunSetupError] = useState<string | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Environment/supervisor connections live here rather than in the
  // components that render it. Otherwise navigating away and back would
  // unmount those components and lose track of what's actually still running.
  // Man I gotta shorten this file.
  const [runningEnvironmentPath, setRunningEnvironmentPath] = useState<string | null>(null);
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>('idle');
  const [environmentLog, setEnvironmentLog] = useState<string[]>([]);
  const [suiteRuns, setSuiteRuns] = useState<Record<string, SuiteRun>>({});
  const runIdToTestId = useRef<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = window.electron.onEnvironmentEvent((event) => {
      switch (event.type) {
        case 'compose.status':
          setEnvironmentLog((prev) => [...prev, event.message]);
          break;
        case 'environment.ready':
          setEnvironmentStatus('ready');
          break;
        case 'environment.failed':
          setEnvironmentStatus('failed');
          setEnvironmentLog((prev) => [
            ...prev,
            `Failed (${event.reason})${event.message ? `: ${event.message}` : ''}`,
          ]);
          break;
        case 'environment.stopped':
          setEnvironmentStatus('stopped');
          break;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron.onSupervisorEvent((event) => {
      const testId = runIdToTestId.current[event.runId];
      if (!testId) return;

      setSuiteRuns((prev) => {
        const run = prev[testId];
        if (!run) return prev;

        switch (event.type) {
          case 'suite.discovered': {
            const testOrder = event.tests.map((t) => t.id);
            const tests = Object.fromEntries(
              event.tests.map((t) => [t.id, { name: t.name, status: 'pending' as const, output: [] }])
            );
            return { ...prev, [testId]: { ...run, testOrder, tests } };
          }
          case 'test.started':
            return {
              ...prev,
              [testId]: {
                ...run,
                tests: {
                  ...run.tests,
                  [event.testId]: { ...run.tests[event.testId], status: 'running' },
                },
              },
            };
          case 'test.stdout':
          case 'test.stderr':
            return {
              ...prev,
              [testId]: {
                ...run,
                tests: {
                  ...run.tests,
                  [event.testId]: {
                    ...run.tests[event.testId],
                    output: [...(run.tests[event.testId]?.output ?? []), event.chunk],
                  },
                },
              },
            };
          case 'test.finished':
            return {
              ...prev,
              [testId]: {
                ...run,
                tests: {
                  ...run.tests,
                  [event.testId]: {
                    ...run.tests[event.testId],
                    status: event.status,
                    durationMs: event.durationMs,
                    error: event.error,
                  },
                },
              },
            };
          case 'run.completed':
            return { ...prev, [testId]: { ...run, status: 'completed' } };
          case 'run.failed':
            return { ...prev, [testId]: { ...run, status: 'failed', failedReason: event.reason } };
          case 'run.aborted':
            return { ...prev, [testId]: { ...run, status: 'aborted' } };
          default:
            return prev;
        }
      });
    });
    return unsubscribe;
  }, []);

  const handleStartEnvironment = async (configPath: string) => {
    setRunningEnvironmentPath(configPath);
    setEnvironmentStatus('starting');
    setEnvironmentLog([]);
    await window.electron.environmentStart(configPath);
  };

  const handleStopEnvironment = async (configPath: string) => {
    setEnvironmentStatus('stopping');
    await window.electron.environmentStop(configPath);
    setRunningEnvironmentPath(null);
  };

  const handleRunSuite = async (test: IntegrationTest) => {
    const runId = crypto.randomUUID();
    runIdToTestId.current[runId] = test.id;
    setSuiteRuns((prev) => ({
      ...prev,
      [test.id]: { runId, status: 'running', failedReason: null, testOrder: [], tests: {} },
    }));
    await window.electron.supervisorExecute(runId, test.entryPoint);
  };

  const handleCancelSuite = async (test: IntegrationTest, configPath: string) => {
    const run = suiteRuns[test.id];
    if (!run) return;
    await window.electron.supervisorCancel(run.runId, configPath);
  };

  const handleImport = (file: ImportedFile) => {
    setFiles((prev) => upsertByPath(prev, file));
    setActivePath(file.path);
  };

  const handleAddTest = (test: { name: string }) => {
    const id = crypto.randomUUID();
    setTests((prev) => [...prev, { id, name: test.name, target: null }]);
    setActiveTestId(id);
  };

  const handleAddEnvironment = (environment: IntegrationEnvironment) => {
    setEnvironments((prev) => upsertByPath(prev, environment));
    setActiveEnvironmentPath(environment.path);
  };

  const handleAddIntegrationTest = (test: { name: string; entryPoint: string }) => {
    if (!activeEnvironmentPath) return;
    setIntegrationTests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: test.name,
        entryPoint: test.entryPoint,
        environmentPath: activeEnvironmentPath,
      },
    ]);
  };

  const handleSelectTarget = (target: TestTarget) => {
    if (!targetPickerFor) return;
    setTests((prev) =>
      prev.map((t) => (t.id === targetPickerFor ? { ...t, target } : t))
    );
    setTargetPickerFor(null);
  };

  const handleCreateNewFunction = () => {
    setTargetPickerFor(null);
    setActiveSection('Files');
  };

  const activeFile = files.find((f) => f.path === activePath) ?? null;
  const activeTest = tests.find((t) => t.id === activeTestId) ?? null;
  const activeEnvironment =
    environments.find((e) => e.path === activeEnvironmentPath) ?? null;
  const displayedEnvironmentStatus =
    activeEnvironmentPath && activeEnvironmentPath === runningEnvironmentPath
      ? environmentStatus
      : 'idle';

  const getExtension = (filePath: string) => {
    const match = /\.([^./\\]+)$/.exec(filePath);
    return match ? match[1].toLowerCase() : '';
  };

  const handleSave = async () => {
    if (!editorRef.current || !activeFile) return;
    const content = editorRef.current.getValue();
    await window.electron.saveFile(activeFile.path, content);
    const updated: ImportedFile = { ...activeFile, content };
    setFiles((prev) => replaceByPath(prev, activeFile.path, updated));
  };

  const handleRunTest = async () => {
    if (!activeTest) return;
    if (!activeTest.target) {
      setTargetPickerFor(activeTest.id);
      return;
    }

    const targetFile = files.find((f) => f.path === activeTest.target!.filePath);
    if (!targetFile) {
      setRunSetupError('Target file is no longer available. Configure a new target.');
      return;
    }

    setRunSetupError(null);
    await window.electron.runStart({
      sourceContent: targetFile.content,
      sourceExtension: getExtension(targetFile.path),
      functionName: activeTest.target.functionName,
      argsJson: activeTest.target.argsJson,
      expectedJson: activeTest.target.expectedJson,
    });
  };

  return (
    <div className="flex h-svh">
      <Sidebar activeItem={activeSection} onNavigate={setActiveSection} />

      {activeSection === 'Dashboard' && <DashboardPanel />}
      {activeSection === 'Repos' && <ReposPanel />}
      {activeSection === 'Files' && (
        <FilesPanel files={files} activePath={activePath} onSelect={setActivePath} />
      )}
      {activeSection === 'Tests' && (
        <TestsPanel
          tests={tests}
          activeId={activeTestId}
          onSelect={setActiveTestId}
          onConfigure={(test) => setTargetPickerFor(test.id)}
        />
      )}
      {activeSection === 'Environments' && (
        <EnvironmentsPanel
          environments={environments}
          activePath={activeEnvironmentPath}
          onSelect={(path) => {
            setActiveEnvironmentPath(path);
            setSelectedIntegrationTestId(null);
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar
          activeSection={activeSection}
          onImport={handleImport}
          onAddTest={handleAddTest}
          onAddEnvironment={handleAddEnvironment}
        />

        {activeSection === 'Environments' ? (
          activeEnvironment ? (
            <EnvironmentDetail
              environment={activeEnvironment}
              status={displayedEnvironmentStatus}
              log={activeEnvironmentPath === runningEnvironmentPath ? environmentLog : []}
              onStart={() => handleStartEnvironment(activeEnvironment.path)}
              onStop={() => handleStopEnvironment(activeEnvironment.path)}
              integrationTests={integrationTests.filter(
                (t) => t.environmentPath === activeEnvironment.path
              )}
              onAddIntegrationTest={handleAddIntegrationTest}
              selectedTestId={selectedIntegrationTestId}
              onSelectTest={setSelectedIntegrationTestId}
              suiteRuns={suiteRuns}
              onRunSuite={handleRunSuite}
              onCancelSuite={(test) => handleCancelSuite(test, activeEnvironment.path)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
              Add an environment to get started
            </div>
          )
        ) : activeSection === 'Tests' ? (
          activeTest ? (
            <TestDetail
              test={activeTest}
              runSetupError={runSetupError}
              onRun={handleRunTest}
              onConfigureTarget={() => setTargetPickerFor(activeTest.id)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
              Add a test to get started
            </div>
          )
        ) : activeFile ? (
          <>
            <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-2 text-sm text-neutral-500 dark:border-neutral-700">
              <span className="truncate">{activeFile.path}</span>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor
                path={activeFile.path}
                value={activeFile.content}
                editorRef={editorRef}
                onSave={handleSave}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Import a file to get started
          </div>
        )}
      </div>

      <SelectFunctionModal
        open={targetPickerFor !== null}
        onClose={() => setTargetPickerFor(null)}
        files={files}
        onSelect={handleSelectTarget}
        onCreateNew={handleCreateNewFunction}
      />
    </div>
  );
}

export default App;
