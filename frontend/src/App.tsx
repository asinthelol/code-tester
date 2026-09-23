import { useState } from 'react';
import CodeEditor from './components/Editor/CodeEditor/CodeEditor';
import ActivityRail from './components/Sidebar/ActivityRail/ActivityRail';
import FileExplorer from './components/Sidebar/FileExplorer/FileExplorer';
import ImportFileButton from './components/Toolbar/ImportFileButton/ImportFileButton';
import type { ImportedFile } from './shared/lib/types';

function App() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);

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
      <ActivityRail />

      {files.length > 0 && (
        <FileExplorer
          files={files}
          activePath={activePath}
          onSelect={setActivePath}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-neutral-300 px-6 py-4 dark:border-neutral-700">
          <h1 className="text-2xl font-medium">Code Tester</h1>
          <ImportFileButton onImport={handleImport} />
        </div>

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
