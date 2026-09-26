import { useState } from 'react';
import Button from '../ui/Button/Button';
import AddButton from './AddButton/AddButton';
import AddTestModal from './AddTestModal/AddTestModal';
import RepoWizardModal from './RepoWizardModal/RepoWizardModal';
import Breadcrumbs from './Breadcrumbs/Breadcrumbs';
import type { ImportedFile, IntegrationEnvironment, Repo, TestSpec } from '../../shared/lib/types';

interface ToolbarProps {
  activeSection: string;
  environments: IntegrationEnvironment[];
  onImport: (file: ImportedFile) => void;
  onAddTest: (test: { name: string; environmentPath: string | null; spec: TestSpec }) => void;
  onAddEnvironment: (environment: IntegrationEnvironment) => void;
  onAddRepo: (result: { repo: Repo; environment: IntegrationEnvironment }) => void;
}

const ADD_BUTTON_LABELS: Record<string, string> = {
  Files: 'Add File',
  Repos: 'Add Repo',
  Tests: 'Add Test',
  Environments: 'Add Environment',
};

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9.5a6 6 0 1 1 12 0c0 3.7 1.06 5 1.5 5.5H4.5c.44-.5 1.5-1.8 1.5-5.5Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);

function Toolbar({
  activeSection,
  environments,
  onImport,
  onAddTest,
  onAddEnvironment,
  onAddRepo,
}: ToolbarProps) {
  const addButtonLabel = ADD_BUTTON_LABELS[activeSection];
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [repoWizardOpen, setRepoWizardOpen] = useState(false);

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
    } else if (activeSection === 'Tests') {
      setTestModalOpen(true);
    } else if (activeSection === 'Environments') {
      try {
        const environment = await window.electron.importEnvironment();
        if (environment) {
          onAddEnvironment(environment);
        }
      } catch (error) {
        console.error('Failed to import environment:', error);
      }
    } else if (activeSection === 'Repos') {
      setRepoWizardOpen(true);
    }
  };

  return (
    <div className="grid h-14 grid-cols-[5fr_5fr] items-center border-b border-neutral-300 px-6 dark:border-neutral-700">
      <Breadcrumbs items={[activeSection]} />

      <div className="flex items-center justify-end gap-8">
        {addButtonLabel && <AddButton label={addButtonLabel} onClick={handleAdd} />}
        <Button aria-label="Notifications" className="size-12 justify-center">
          <BellIcon />
        </Button>
      </div>

      <AddTestModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        environments={environments}
        onAdd={onAddTest}
      />

      <RepoWizardModal
        open={repoWizardOpen}
        onClose={() => setRepoWizardOpen(false)}
        onComplete={(result) => {
          setRepoWizardOpen(false);
          onAddRepo(result);
        }}
      />
    </div>
  );
}

export default Toolbar;
