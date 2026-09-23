import { useState } from 'react';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import Sidebar from './components/Sidebar/Sidebar';
import DashboardPanel from './components/Sidebar/DashboardPanel/DashboardPanel';
import FilesPanel from './components/Sidebar/FilesPanel/FilesPanel';
import ReposPanel from './components/Sidebar/ReposPanel/ReposPanel';
import TestsPanel from './components/Sidebar/TestsPanel/TestsPanel';
import Toolbar from './components/Toolbar/Toolbar';
import type { ImportedFile } from './shared/lib/types';

function App() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Files');

  const handleImport = (file: ImportedFile) => {
    setFiles((prev) => {
      const existingIndex = prev.findIndex((f) => f.path === file.path);
      if (existingIndex === -1) {
        return [...prev, file];
      }
      const next = [...prev];
      next[existingIndex] = file;
      return next;
    });
    setActivePath(file.path);
  };

  const activeFile = files.find((f) => f.path === activePath) ?? null;

  return (
    <div className="flex h-svh">
      <Sidebar activeItem={activeSection} onNavigate={setActiveSection} />

      {activeSection === 'Dashboard' && <DashboardPanel />}
      {activeSection === 'Repos' && <ReposPanel />}
      {activeSection === 'Files' && (
        <FilesPanel files={files} activePath={activePath} onSelect={setActivePath} />
      )}
      {activeSection === 'Tests' && <TestsPanel />}

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar activeSection={activeSection} onImport={handleImport} />

        {activeFile ? (
          <>
            <div className="border-b border-neutral-300 px-6 py-2 text-sm text-neutral-500 dark:border-neutral-700">
              {activeFile.path}
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor path={activeFile.path} value={activeFile.content} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Import a file to get started
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
