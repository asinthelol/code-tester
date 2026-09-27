import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
}

//the only way out of the modal is by clicking close!
function Modal({ open, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
