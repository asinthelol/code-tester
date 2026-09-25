import { useState } from 'react';
import Modal from '../../ui/Modal/Modal';

interface AddIntegrationTestModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (test: { name: string; entryPoint: string }) => void;
}

function AddIntegrationTestModal({ open, onClose, onAdd }: AddIntegrationTestModalProps) {
  const [name, setName] = useState('');
  const [entryPoint, setEntryPoint] = useState('tests/index.ts');

  const reset = () => {
    setName('');
    setEntryPoint('tests/index.ts');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!entryPoint.trim()) return;
    onAdd({ name: name.trim() || entryPoint, entryPoint: entryPoint.trim() });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Integration Test">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. User signup flow"
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
          Entry point
          <input
            type="text"
            value={entryPoint}
            onChange={(event) => setEntryPoint(event.target.value)}
            placeholder="tests/index.ts"
            className="rounded-md border border-neutral-300 px-2 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <span className="text-xs text-neutral-500">
            Path to the suite module, resolved relative to the environment's mounted suite root.
          </span>
        </label>

        <button
          type="button"
          onClick={handleAdd}
          className="self-end rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Add
        </button>
      </div>
    </Modal>
  );
}

export default AddIntegrationTestModal;
