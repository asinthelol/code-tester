import Button from '../ui/Button/Button';
import AddButton from './AddButton/AddButton';
import Breadcrumbs from './Breadcrumbs/Breadcrumbs';
import type { ImportedFile } from '../../shared/lib/types';

interface ToolbarProps {
  activeSection: string;
  onImport: (file: ImportedFile) => void;
}

const ADD_BUTTON_LABELS: Record<string, string> = {
  Files: 'Add File',
  Repos: 'Add Repo',
  Tests: 'Add Test',
};

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9.5a6 6 0 1 1 12 0c0 3.7 1.06 5 1.5 5.5H4.5c.44-.5 1.5-1.8 1.5-5.5Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);

function Toolbar({ activeSection, onImport }: ToolbarProps) {
  const addButtonLabel = ADD_BUTTON_LABELS[activeSection];

  const handleAdd = async () => {
    if (activeSection === 'Files') {
      try {
        const file = await window.electron.importFile();
        if (file) {
          onImport(file);
        }
      } catch (error) {
        console.error('Failed to import file:', error);
      }
    }
  };

  return (
    <div className="grid grid-cols-[7fr_3fr] items-center border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
      <Breadcrumbs items={[activeSection]} />

      <div className="flex items-center justify-end gap-3">
        {addButtonLabel && <AddButton label={addButtonLabel} onClick={handleAdd} />}
        <Button aria-label="Notifications" className="p-1.5">
          <BellIcon />
        </Button>
      </div>
    </div>
  );
}

export default Toolbar;
