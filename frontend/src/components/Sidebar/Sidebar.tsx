import { useState } from 'react';
import SidebarHeader from './SidebarHeader/SidebarHeader';
import SideLink from './SideLink/SideLink';
import { NAV_ITEMS, SETTINGS_ITEM } from './navItems';

interface SidebarProps {
  activeItem: string;
  onNavigate: (title: string) => void;
}

function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex h-full flex-col border-r border-neutral-300 transition-[width] duration-150 dark:border-neutral-700 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <SidebarHeader collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />

      <div className="mx-2 border-t border-neutral-300 dark:border-neutral-700" />

      <nav className="flex flex-1 flex-col gap-0.5 py-1">
        {NAV_ITEMS.map((item) => (
          <SideLink
            key={item.title}
            icon={item.icon}
            title={item.title}
            collapsed={collapsed}
            active={activeItem === item.title}
            onClick={() => onNavigate(item.title)}
          />
        ))}
      </nav>

      <div className="mx-2 my-2 border-t border-neutral-300 dark:border-neutral-700" />

      <div className="pb-2">
        <SideLink
          icon={SETTINGS_ITEM.icon}
          title={SETTINGS_ITEM.title}
          collapsed={collapsed}
          active={activeItem === SETTINGS_ITEM.title}
          onClick={() => onNavigate(SETTINGS_ITEM.title)}
        />
      </div>
    </div>
  );
}

export default Sidebar;
