import type { ReactNode } from 'react';

const dashboardIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
    <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
    <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
  </svg>
);

const reposIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.5 6.25A2.25 2.25 0 0 1 5.75 4h3.69a1 1 0 0 1 .79.39l1.31 1.7a1 1 0 0 0 .79.39h6.41a2.25 2.25 0 0 1 2.25 2.25v9.02a2.25 2.25 0 0 1-2.25 2.25H5.75a2.25 2.25 0 0 1-2.25-2.25V6.25Z"
    />
  </svg>
);

const filesIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 2.75h7.5L18.25 7.5V21a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V3.5A.75.75 0 0 1 6 2.75Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 2.75V7.5h5" />
  </svg>
);

const testsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 3h5M10.25 3v5.5L5.75 18a1.5 1.5 0 0 0 1.35 2.15h9.8A1.5 1.5 0 0 0 18.25 18l-4.5-9.5V3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h9" />
  </svg>
);

const settingsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.1 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10.5a1.65 1.65 0 0 0 1-1.51V2.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8.5a1.65 1.65 0 0 0 1.51 1h.09a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
    />
  </svg>
);

export interface NavItem {
  title: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: dashboardIcon },
  { title: 'Repos', icon: reposIcon },
  { title: 'Files', icon: filesIcon },
  { title: 'Tests', icon: testsIcon },
];

export const SETTINGS_ITEM: NavItem = { title: 'Settings', icon: settingsIcon };

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_ITEMS, SETTINGS_ITEM];
