import type { ReactNode } from 'react';
import { MdOutlineDns, MdOutlineDescription, MdOutlineFolder, MdOutlineScience, MdOutlineSettings } from 'react-icons/md';

export interface NavItem {
  title: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Repos', icon: <MdOutlineFolder /> },
  { title: 'Files', icon: <MdOutlineDescription /> },
  { title: 'Tests', icon: <MdOutlineScience /> },
  { title: 'Environments', icon: <MdOutlineDns /> },
];

export const SETTINGS_ITEM: NavItem = { title: 'Settings', icon: <MdOutlineSettings /> };

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_ITEMS, SETTINGS_ITEM];
