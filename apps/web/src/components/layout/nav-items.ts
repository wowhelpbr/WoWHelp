import { Compass, LayoutDashboard, Settings, Users } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', key: 'home', icon: Compass },
  // Coleções: montarias, mascotes e brinquedos (abas dentro da página).
  { href: '/mounts', key: 'mounts', icon: null, also: ['/pets', '/toys'] },
  { href: '/community', key: 'community', icon: Users },
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/settings', key: 'settings', icon: Settings },
] as const;

/** pathname null = ainda carregando (rota dinâmica): nada marcado como ativo. */
export function isActive(pathname: string | null, href: string, also: readonly string[] = []) {
  if (pathname === null) return false;
  if (href === '/') return pathname === '/';
  return [href, ...also].some((h) => pathname === h || pathname.startsWith(`${h}/`));
}
