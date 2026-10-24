'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, isActive } from './nav-items';

/**
 * Navegação do desktop (no celular quem navega é a barra de abas). Ativo: sublinhado limão com brilho.
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
    <ul className="hidden h-full items-stretch gap-1 md:flex lg:gap-3">
      {NAV_ITEMS.filter((item) => item.key !== 'settings').map((item) => {
        const active = isActive(pathname, item.href, 'also' in item ? item.also : []);
        const Icon = item.icon ?? MountGlyph;
        return (
          <li key={item.key} className="flex">
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-2 px-2.5 font-display text-xs font-bold tracking-[0.08em] uppercase transition-colors',
                'after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:bg-primary after:shadow-[0_0_18px_rgb(197_251_20/0.45),0_0_2px_rgb(197_251_20/0.9)] after:transition-opacity',
                active
                  ? 'text-foreground after:opacity-100 [&>svg]:text-primary'
                  : 'text-faint after:opacity-0 hover:text-muted-foreground',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
