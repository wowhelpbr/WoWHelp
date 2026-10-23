import { Compass, LayoutDashboard, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', key: 'home', icon: Compass },
  { href: '/mounts', key: 'mounts', icon: null },
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/settings', key: 'settings', icon: Settings },
] as const;

/** pathname null = ainda carregando (rota dinâmica): nada marcado como ativo. */
export function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
