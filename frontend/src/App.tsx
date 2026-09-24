import { useState } from 'react';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardPanel from './components/Sidebar/DashboardPanel/DashboardPanel';
import FilesPanel from './components/Sidebar/FilesPanel/FilesPanel';
import ReposPanel from './components/Sidebar/ReposPanel/ReposPanel';
import TestsPanel from './components/Sidebar/TestsPanel/TestsPanel';
import SelectFunctionModal from './components/Tests/SelectFunctionModal/SelectFunctionModal';
import Toolbar from './components/Toolbar/Toolbar';
import type { ImportedFile, TestItem, TestTarget } from './shared/lib/types';

function upsertByPath<T extends { path: string }>(list: T[], item: T) {
  const existingIndex = list.findIndex((f) => f.path === item.path);
  if (existingIndex === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[existingIndex] = item;
  return next;
}

function App() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [activeTestPath, setActiveTestPath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Files');
  const [targetPickerFor, setTargetPickerFor] = useState<string | null>(null);

  const handleImport = (file: ImportedFile) => {
    setFiles((prev) => upsertByPath(prev, file));
    setActivePath(file.path);
  };

  const handleAddTest = (file: ImportedFile) => {
    setTests((prev) => upsertByPath(prev, { ...file, target: null }));
    setActiveTestPath(file.path);
  };

  const handleSelectTarget = (target: TestTarget) => {
    if (!targetPickerFor) return;
    setTests((prev) =>
      prev.map((t) => (t.path === targetPickerFor ? { ...t, target } : t))
    );
    setTargetPickerFor(null);
  };

  const handleCreateNewFunction = () => {
    setTargetPickerFor(null);
    setActiveSection('Files');
  };

  const activeFile = files.find((f) => f.path === activePath) ?? null;
  const activeTest = tests.find((t) => t.path === activeTestPath) ?? null;
  const activeItem = activeSection === 'Tests' ? activeTest : activeFile;

  const handleRunTest = () => {
    if (!activeTest) return;
    if (!activeTest.target) {
      setTargetPickerFor(activeTest.path);
      return;
    }
    console.info(
      `Run "${activeTest.target.functionName}" from ${activeTest.target.filePath} (execution isn't wired up yet)`
    );
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
          activePath={activeTestPath}
          onSelect={setActiveTestPath}
          onConfigure={(test) => setTargetPickerFor(test.path)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar activeSection={activeSection} onImport={handleImport} onAddTest={handleAddTest} />

        {activeItem ? (
          <>
            <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-2 text-sm text-neutral-500 dark:border-neutral-700">
              <span className="truncate">{activeItem.path}</span>
              {activeSection === 'Tests' && (
                <button
                  type="button"
                  onClick={handleRunTest}
                  className="ml-4 shrink-0 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                >
                  Run
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor path={activeItem.path} value={activeItem.content} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            {activeSection === 'Tests'
              ? 'Add a test to get started'
              : 'Import a file to get started'}
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
