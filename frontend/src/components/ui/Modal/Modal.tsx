import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-neutral-300 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="border-b border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-900 dark:border-neutral-700 dark:text-neutral-100">
          {title}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
