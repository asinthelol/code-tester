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

  const reset = () => {
    setSelectedFile(null);
    setFunctions([]);
    setLoading(false);
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

  const handlePickFunction = (fn: FunctionInfo) => {
    onSelect({
      filePath: fn.filePath,
      functionName: fn.name,
      startLine: fn.startLine,
      endLine: fn.endLine,
    });
    handleClose();
  };

  const handleCreateNew = () => {
    onCreateNew();
    handleClose();
  };

  const parsableFiles = files.filter((file) => isParsable(file.path));

  return (
    <Modal open={open} onClose={handleClose} title="Select Function">
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
      ) : (
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
                  onClick={() => handlePickFunction(fn)}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{fn.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">line {fn.startLine}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default SelectFunctionModal;
