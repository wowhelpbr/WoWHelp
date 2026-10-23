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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, 'also' in item ? item.also : []);
          const Icon = item.icon ?? MountGlyph;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.72rem] leading-tight font-semibold',
                  'before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:bg-primary',
                  active ? 'text-primary before:opacity-100' : 'text-muted-foreground before:opacity-0',
                )}
              >
                <Icon aria-hidden className="size-5" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
