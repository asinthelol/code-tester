import { useState } from 'react';
import ImportFileButton from './components/Toolbar/ImportFileButton/ImportFileButton';
import type { ImportedFile } from './shared/lib/types';

function App() {
  const [file, setFile] = useState<ImportedFile | null>(null);

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-2xl font-medium">Code Tester</h1>
        <ImportFileButton onImport={setFile} />
      </div>

      {file && (
        <div className="w-full max-w-3xl rounded-md border border-neutral-300 dark:border-neutral-700">
          <div className="border-b border-neutral-300 px-4 py-2 text-sm text-neutral-500 dark:border-neutral-700">
            {file.path}
          </div>
          <pre className="max-h-[60svh] overflow-auto p-4 text-left text-sm">
            <code>{file.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
