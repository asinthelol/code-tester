import { useState } from 'react';
import Modal from '../Modal/Modal';

interface ConfirmDeleteModalProps {
  open: boolean;
  itemLabel: string;
  // When set, shows a "also delete ... from disk" checkbox.
  diskDescription?: string;
  onCancel: () => void;
  onConfirm: (deleteFromDisk: boolean) => void;
}

function ConfirmDeleteModal({
  open,
  itemLabel,
  diskDescription,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [deleteFromDisk, setDeleteFromDisk] = useState(false);

  const handleCancel = () => {
    setDeleteFromDisk(false);
    onCancel();
  };

  const handleConfirm = () => {
    const confirmedDeleteFromDisk = deleteFromDisk;
    setDeleteFromDisk(false);
    onConfirm(confirmedDeleteFromDisk);
  };

  return (
    <Modal open={open} title="Delete">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Remove <span className="font-medium text-neutral-900 dark:text-neutral-100">{itemLabel}</span>?
        </p>

        {diskDescription && (
          <label className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={deleteFromDisk}
              onChange={(event) => setDeleteFromDisk(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              Also delete {diskDescription} from disk
              <span className="block text-xs text-neutral-500">This can't be undone.</span>
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDeleteModal;
