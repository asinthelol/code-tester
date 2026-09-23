import type { ImportedFile } from '../../../shared/lib/types';

interface ImportFileButtonProps {
  onImport: (file: ImportedFile) => void;
}

function ImportFileButton({ onImport }: ImportFileButtonProps) {
  const handleClick = async () => {
    try {
      const file = await window.electron.importFile();
      if (file) {
        onImport(file);
      }
    } catch (error) {
      console.error('Failed to import file:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
    >
      Import File
    </button>
  );
}

export default ImportFileButton;
