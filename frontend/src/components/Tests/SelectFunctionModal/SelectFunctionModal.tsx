import { useState } from 'react';
import Modal from '../../ui/Modal/Modal';
import { extractFunctions, isParsable } from '../../../shared/lib/treeSitter';
import type { FunctionInfo, ImportedFile, TestTarget } from '../../../shared/lib/types';

interface SelectFunctionModalProps {
  open: boolean;
  onClose: () => void;
  files: ImportedFile[];
  onSelect: (target: TestTarget) => void;
  onCreateNew: () => void;
}

function SelectFunctionModal({
  open,
  onClose,
  files,
  onSelect,
  onCreateNew,
}: SelectFunctionModalProps) {
  const [selectedFile, setSelectedFile] = useState<ImportedFile | null>(null);
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<FunctionInfo | null>(null);
  const [argsJson, setArgsJson] = useState('[]');
  const [expectedJson, setExpectedJson] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  const reset = () => {
    setSelectedFile(null);
    setFunctions([]);
    setLoading(false);
    setSelectedFunction(null);
    setArgsJson('[]');
    setExpectedJson('');
    setConfigError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickFile = async (file: ImportedFile) => {
    setSelectedFile(file);
    setLoading(true);
    try {
      const found = await extractFunctions(file.path, file.content);
      setFunctions(found);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedFunction) return;

    let parsedArgs: unknown;
    try {
      parsedArgs = JSON.parse(argsJson || '[]');
    } catch {
      setConfigError('Arguments must be valid JSON, e.g. [1, 2]');
      return;
    }
    if (!Array.isArray(parsedArgs)) {
      setConfigError('Arguments must be a JSON array, e.g. [1, 2]');
      return;
    }

    if (expectedJson.trim() !== '') {
      try {
        JSON.parse(expectedJson);
      } catch {
        setConfigError('Expected value must be valid JSON, e.g. 5 or "hello"');
        return;
      }
    }

    onSelect({
      filePath: selectedFunction.filePath,
      functionName: selectedFunction.name,
      startLine: selectedFunction.startLine,
      endLine: selectedFunction.endLine,
      argsJson: argsJson || '[]',
      expectedJson,
    });
    handleClose();
  };

  const handleCreateNew = () => {
    onCreateNew();
    handleClose();
  };

  const parsableFiles = files.filter((file) => isParsable(file.path));

  return (
    <Modal open={open} title="Select Function">
      {!selectedFile ? (
        <div className="flex flex-col gap-2">
          {parsableFiles.length === 0 ? (
            <p className="text-sm text-neutral-500">No parsable files imported yet.</p>
          ) : (
            parsableFiles.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => handlePickFile(file)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800/60"
              >
                {file.name}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={handleCreateNew}
            className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60"
          >
            + Create a new function
          </button>
        </div>
      ) : !selectedFunction ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="self-start text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Back
          </button>

          {loading ? (
            <p className="text-sm text-neutral-500">Parsing {selectedFile.name}…</p>
          ) : functions.length === 0 ? (
            <p className="text-sm text-neutral-500">No functions found in {selectedFile.name}.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {functions.map((fn) => (
                <button
                  key={`${fn.name}:${fn.startLine}`}
                  type="button"
                  onClick={() => setSelectedFunction(fn)}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{fn.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">line {fn.startLine}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSelectedFunction(null)}
            className="self-start text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Back
          </button>

          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Calling{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {selectedFunction.name}
            </span>{' '}
            from {selectedFile.name}
          </p>

          <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
            Arguments (JSON array)
            <input
              type="text"
              value={argsJson}
              onChange={(event) => setArgsJson(event.target.value)}
              placeholder="[1, 2]"
              className="rounded-md border border-neutral-300 px-2 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <span className="text-xs text-neutral-500">
              Each item is passed as its own argument, e.g. [1, 2] calls fn(1, 2). For a
              function that takes a single array, wrap it: [[1, 2]] calls fn([1, 2]).
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
            Expected result (JSON, optional)
            <input
              type="text"
              value={expectedJson}
              onChange={(event) => setExpectedJson(event.target.value)}
              placeholder='e.g. 3 or "hello"'
              className="rounded-md border border-neutral-300 px-2 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>

          {configError && <p className="text-xs text-red-500">{configError}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            className="self-end rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Set Target
          </button>
        </div>
      )}
    </Modal>
  );
}

export default SelectFunctionModal;
