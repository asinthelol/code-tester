import Button from '../../ui/Button/Button';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  const logo = (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 shrink-0">
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-neutral-900 dark:fill-neutral-100" />
      <path
        d="M9 8.5 6 12l3 3.5M15 8.5 18 12l-3 3.5"
        className="stroke-neutral-50 dark:stroke-neutral-900"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  const toggleButton = (
    <Button
      onClick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className="shrink-0 p-1.5"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <path d="M9.5 4.5v15" />
      </svg>
    </Button>
  );

  if (collapsed) {
    return (
      <div className="flex items-center justify-center px-3 py-3">{toggleButton}</div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {logo}
        <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Code Tester
        </span>
      </div>

      {toggleButton}
    </div>
  );
}

export default SidebarHeader;
