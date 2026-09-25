import { useState } from 'react';
import Modal from '../../ui/Modal/Modal';

interface AddTestModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (test: { name: string }) => void;
}

function AddTestModal({ open, onClose, onAdd }: AddTestModalProps) {
  const [name, setName] = useState('');

  const handleClose = () => {
    setName('');
    onClose();
  };

  const handleAdd = () => {
    onAdd({ name: name.trim() || 'New Test' });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Test">
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

export default AddTestModal;
