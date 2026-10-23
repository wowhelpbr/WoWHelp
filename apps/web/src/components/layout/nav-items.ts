import { Compass, LayoutDashboard, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', key: 'home', icon: Compass },
  { href: '/mounts', key: 'mounts', icon: null },
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/settings', key: 'settings', icon: Settings },
] as const;

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
