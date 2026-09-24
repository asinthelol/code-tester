import { useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardPanel from './components/Sidebar/DashboardPanel/DashboardPanel';
import FilesPanel from './components/Sidebar/FilesPanel/FilesPanel';
import ReposPanel from './components/Sidebar/ReposPanel/ReposPanel';
import TestsPanel from './components/Sidebar/TestsPanel/TestsPanel';
import SelectFunctionModal from './components/Tests/SelectFunctionModal/SelectFunctionModal';
import RunOutputPanel from './components/Tests/RunOutputPanel/RunOutputPanel';
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

function replaceByPath<T extends { path: string }>(list: T[], oldPath: string, updated: T) {
  return list.map((item) => (item.path === oldPath ? updated : item));
}

function App() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [activeTestPath, setActiveTestPath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Files');
  const [targetPickerFor, setTargetPickerFor] = useState<string | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

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

  const resolveAndSave = async (
    item: ImportedFile,
    content: string
  ): Promise<{ path: string; name: string } | null> => {
    if (item.path.startsWith('test:')) {
      return window.electron.saveFileAs(content, item.name);
    }
    await window.electron.saveFile(item.path, content);
    return { path: item.path, name: item.name };
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.getValue();

    if (activeSection === 'Tests') {
      if (!activeTest) return;
      const saved = await resolveAndSave(activeTest, content);
      if (!saved) return;
      const updated: TestItem = { ...activeTest, path: saved.path, name: saved.name, content };
      setTests((prev) => replaceByPath(prev, activeTest.path, updated));
      if (activeTestPath === activeTest.path) setActiveTestPath(saved.path);
    } else {
      if (!activeFile) return;
      const saved = await resolveAndSave(activeFile, content);
      if (!saved) return;
      const updated: ImportedFile = { ...activeFile, path: saved.path, name: saved.name, content };
      setFiles((prev) => replaceByPath(prev, activeFile.path, updated));
      if (activePath === activeFile.path) setActivePath(saved.path);
    }
  };

  const handleRunTest = async () => {
    if (!activeTest || !editorRef.current) return;
    if (!activeTest.target) {
      setTargetPickerFor(activeTest.path);
      return;
    }

    const content = editorRef.current.getValue();
    const saved = await resolveAndSave(activeTest, content);
    if (!saved) return;

    const updated: TestItem = { ...activeTest, path: saved.path, name: saved.name, content };
    setTests((prev) => replaceByPath(prev, activeTest.path, updated));
    if (activeTestPath === activeTest.path) setActiveTestPath(saved.path);

    window.electron.runStart(saved.path);
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
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                >
                  Save
                </button>
                {activeSection === 'Tests' && (
                  <button
                    type="button"
                    onClick={handleRunTest}
                    className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  >
                    Run
                  </button>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor
                path={activeItem.path}
                value={activeItem.content}
                editorRef={editorRef}
                onSave={handleSave}
              />
            </div>
            {activeSection === 'Tests' && <RunOutputPanel />}
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
