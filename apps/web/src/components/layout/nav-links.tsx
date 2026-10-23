'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, isActive } from './nav-items';

/**
 * Navegação do desktop (no celular quem navega é a barra de abas). Ativo: sublinhado dourado.
 * Em rotas dinâmicas o caminho só existe na requisição: mostra a versão sem destaque enquanto isso.
 */
export function NavLinks() {
  return (
    <Suspense fallback={<NavLinksView pathname={null} />}>
      <NavLinksLive />
    </Suspense>
  );
}

function NavLinksLive() {
  return <NavLinksView pathname={usePathname()} />;
}

function NavLinksView({ pathname }: { pathname: string | null }) {
  const t = useTranslations('Nav');
  return (
    <ul className="hidden h-full items-stretch gap-1 md:flex">
      {NAV_ITEMS.filter((item) => item.key !== 'settings').map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.key} className="flex">
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center px-3 text-[0.95rem] font-semibold transition-colors',
                'after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary after:transition-opacity',
                active
                  ? 'text-foreground after:opacity-100'
                  : 'text-muted-foreground after:opacity-0 hover:text-foreground',
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
