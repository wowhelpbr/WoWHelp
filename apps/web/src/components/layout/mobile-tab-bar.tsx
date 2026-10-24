'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, isActive } from './nav-items';

/** Abas fixas no rodapé do celular: alvo de toque grande, sem depender de hover. */
export function MobileTabBar() {
  return (
    <Suspense fallback={<MobileTabBarView pathname={null} />}>
      <MobileTabBarLive />
    </Suspense>
  );
}

function MobileTabBarLive() {
  return <MobileTabBarView pathname={usePathname()} />;
}

function MobileTabBarView({ pathname }: { pathname: string | null }) {
  const t = useTranslations('Nav');
  return (
    <nav
      aria-label={t('main')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {/* Quatro abas (proposta neon); as configurações ficam no quadrado da conta, no topo. */}
        {NAV_ITEMS.filter((item) => item.key !== 'settings').map((item) => {
          const active = isActive(pathname, item.href, 'also' in item ? item.also : []);
          const Icon = item.icon ?? MountGlyph;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-1 font-display text-[0.625rem] leading-tight font-bold tracking-[0.06em] uppercase',
                  'before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:bg-primary before:shadow-[0_0_14px_rgb(197_251_20/0.5)]',
                  active
                    ? 'text-foreground before:opacity-100 [&>svg]:text-primary [&>svg]:drop-shadow-[0_0_6px_rgb(197_251_20/0.6)]'
                    : 'text-faint before:opacity-0',
                )}
              >
                <Icon aria-hidden className="size-5" />
                {item.key === 'dashboard' ? t('dashboardShort') : t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
