'use client';

import { useTranslations } from 'next-intl';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, isActive } from './nav-items';

/** Abas fixas no rodapé do celular: alvo de toque grande, sem depender de hover. */
export function MobileTabBar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  return (
    <nav
      aria-label={t('main')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
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
