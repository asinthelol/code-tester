import { useState } from 'react';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardPanel from './components/Sidebar/DashboardPanel/DashboardPanel';
import FilesPanel from './components/Sidebar/FilesPanel/FilesPanel';
import ReposPanel from './components/Sidebar/ReposPanel/ReposPanel';
import TestsPanel from './components/Sidebar/TestsPanel/TestsPanel';
import Toolbar from './components/Toolbar/Toolbar';
import type { ImportedFile } from './shared/lib/types';

function upsertByPath(list: ImportedFile[], item: ImportedFile) {
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
  const [tests, setTests] = useState<ImportedFile[]>([]);
  const [activeTestPath, setActiveTestPath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Files');

  const handleImport = (file: ImportedFile) => {
    setFiles((prev) => upsertByPath(prev, file));
    setActivePath(file.path);
  };

  const handleAddTest = (test: ImportedFile) => {
    setTests((prev) => upsertByPath(prev, test));
    setActiveTestPath(test.path);
  };

  const activeFile = files.find((f) => f.path === activePath) ?? null;
  const activeTest = tests.find((t) => t.path === activeTestPath) ?? null;
  const activeItem = activeSection === 'Tests' ? activeTest : activeFile;

  return (
    <div className="flex h-svh">
      <Sidebar activeItem={activeSection} onNavigate={setActiveSection} />

      {activeSection === 'Dashboard' && <DashboardPanel />}
      {activeSection === 'Repos' && <ReposPanel />}
      {activeSection === 'Files' && (
        <FilesPanel files={files} activePath={activePath} onSelect={setActivePath} />
      )}
      {activeSection === 'Tests' && (
        <TestsPanel tests={tests} activePath={activeTestPath} onSelect={setActiveTestPath} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar activeSection={activeSection} onImport={handleImport} onAddTest={handleAddTest} />

        {activeItem ? (
          <>
            <div className="border-b border-neutral-300 px-6 py-2 text-sm text-neutral-500 dark:border-neutral-700">
              {activeItem.path}
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
    </div>
  );
}

export default App;
