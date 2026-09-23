import Button from '../ui/Button/Button';
import { ALL_NAV_ITEMS } from '../Sidebar/navItems';
import ImportFileButton from './ImportFileButton/ImportFileButton';
import type { ImportedFile } from '../../shared/lib/types';

interface ToolbarProps {
  activeSection: string;
  onImport: (file: ImportedFile) => void;
}

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
  const current = ALL_NAV_ITEMS.find((item) => item.title === activeSection);

  return (
    <div className="grid grid-cols-[7fr_3fr] items-center border-b border-neutral-300 px-6 py-3 dark:border-neutral-700">
      <div className="flex min-w-0 items-center gap-2">
        {current && (
          <span className="flex size-5 shrink-0 items-center justify-center text-neutral-500 [&>svg]:size-5">
            {current.icon}
          </span>
        )}
        <h1 className="truncate text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {activeSection}
        </h1>
      </div>

      <div className="flex items-center justify-end gap-3">
        <ImportFileButton onImport={onImport} />
        <Button aria-label="Notifications" className="p-1.5">
          <BellIcon />
        </Button>
      </div>
    </div>
  );
}

export default Toolbar;
