import { useState } from 'react';
import Modal from '../../ui/Modal/Modal';
import type { IntegrationEnvironment, TestSpec } from '../../../shared/lib/types';

interface AddTestModalProps {
  open: boolean;
  onClose: () => void;
  environments: IntegrationEnvironment[];
  onAdd: (test: { name: string; environmentPath: string | null; spec: TestSpec }) => void;
}

type Kind = 'target' | 'entryPoint';

function AddTestModal({ open, onClose, environments, onAdd }: AddTestModalProps) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Kind>('target');
  const [entryPoint, setEntryPoint] = useState('tests/index.ts');
  const [environmentPath, setEnvironmentPath] = useState('');

  const reset = () => {
    setName('');
    setKind('target');
    setEntryPoint('tests/index.ts');
    setEnvironmentPath('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (kind === 'entryPoint' && !entryPoint.trim()) return;

    const spec: TestSpec =
      kind === 'target'
        ? { kind: 'target', target: null }
        : { kind: 'entryPoint', entryPoint: entryPoint.trim() };

    onAdd({
      name: name.trim() || (kind === 'entryPoint' ? entryPoint.trim() : 'New Test'),
      environmentPath: environmentPath || null,
      spec,
    });
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

        <div className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
          Type
          <div className="flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setKind('target')}
              className={`flex-1 px-2 py-1.5 text-sm ${
                kind === 'target'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              Pick a function
            </button>
            <button
              type="button"
              onClick={() => setKind('entryPoint')}
              className={`flex-1 px-2 py-1.5 text-sm ${
                kind === 'entryPoint'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              Entry point script
            </button>
          </div>
        </div>

        {kind === 'entryPoint' && (
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
              Path to the suite module, resolved relative to the suite root.
            </span>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm text-neutral-700 dark:text-neutral-300">
          Environment
          <select
            value={environmentPath}
            onChange={(event) => setEnvironmentPath(event.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="">None (local)</option>
            {environments.map((env) => (
              <option key={env.path} value={env.path}>
                {env.name}
              </option>
            ))}
          </select>
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
