import type { ReactNode } from 'react';
import Button from '../../ui/Button/Button';

interface SideLinkProps {
  icon: ReactNode;
  title: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}

function SideLink({ icon, title, collapsed, active = false, onClick }: SideLinkProps) {
  return (
    <div className="group relative w-full px-2">
      <Button
        active={active}
        onClick={onClick}
        aria-label={title}
        className={`w-full gap-3 px-2.5 py-2 ${collapsed ? 'justify-center' : ''}`}
      >
        <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5">
          {icon}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{title}</span>
        )}
      </Button>

      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 dark:bg-neutral-700"
        >
          {title}
        </span>
      )}
    </div>
  );
}

export default SideLink;
