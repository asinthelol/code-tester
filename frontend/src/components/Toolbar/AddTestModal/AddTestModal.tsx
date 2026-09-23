import { useState } from 'react';
import Modal from '../../ui/Modal/Modal';
import type { ImportedFile } from '../../../shared/lib/types';

interface AddTestModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (test: ImportedFile) => void;
}

const LANGUAGES = [
  { label: 'JavaScript', extension: 'js' },
  { label: 'TypeScript', extension: 'ts' },
  { label: 'Python', extension: 'py' },
  { label: 'Go', extension: 'go' },
  { label: 'Rust', extension: 'rs' },
  { label: 'Java', extension: 'java' },
  { label: 'C', extension: 'c' },
  { label: 'C++', extension: 'cpp' },
  { label: 'C#', extension: 'cs' },
  { label: 'Ruby', extension: 'rb' },
  { label: 'PHP', extension: 'php' },
];

function AddTestModal({ open, onClose, onAdd }: AddTestModalProps) {
  const [step, setStep] = useState<'choice' | 'manual'>('choice');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0].extension);

  const reset = () => {
    setStep('choice');
    setName('');
    setLanguage(LANGUAGES[0].extension);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImport = async () => {
    try {
      const file = await window.electron.importFile();
      if (file) {
        onAdd(file);
        handleClose();
      }
    } catch (error) {
      console.error('Failed to import test file:', error);
    }
  };

  const handleCreate = () => {
    const trimmed = name.trim() || 'New Test';
    onAdd({
      path: `test:${crypto.randomUUID()}.${language}`,
      name: `${trimmed}.${language}`,
      content: '',
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Test">
      {step === 'choice' ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleImport}
            className="rounded-md border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60"
          >
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Import a file</span>
            <p className="text-xs text-neutral-500">Language is detected from the file extension.</p>
          </button>
          <button
            type="button"
            onClick={() => setStep('manual')}
            className="rounded-md border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/60"
          >
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Write manually</span>
            <p className="text-xs text-neutral-500">Pick a language and start from a blank test.</p>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New Test"
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.extension} value={lang.extension}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStep('choice')}
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AddTestModal;
