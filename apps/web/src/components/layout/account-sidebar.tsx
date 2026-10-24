'use client';

import { CalendarCheck, FileUp, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

type Item = {
  key: 'overview' | 'characters' | 'collections' | 'planner' | 'addonImport' | 'settings';
  icon: LucideIcon | typeof MountGlyph;
} & ({ href: '/dashboard' | '/characters' | '/mounts' | '/planner' | '/import' | '/settings' } | { phase: number });

// Mapa de navegação da conta (planning/docs/05_WEB_PWA_E_UX.md). Seções que
// ainda não existem aparecem com a fase prevista, sem link: nada de tela falsa.
const ITEMS: Item[] = [
  { key: 'overview', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'characters', icon: Users, href: '/characters' },
  { key: 'collections', icon: MountGlyph, href: '/mounts' },
  { key: 'planner', icon: CalendarCheck, href: '/planner' },
  { key: 'addonImport', icon: FileUp, href: '/import' },
  { key: 'settings', icon: Settings, href: '/settings' },
];

/** Menu lateral da área logada (só desktop; no celular a navegação é a barra de abas). */
export function AccountSidebar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('accountNav')} className="hidden border-r border-border-soft bg-sidebar lg:block">
      <ul className="sticky top-16 flex flex-col gap-1 p-3.5 pt-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          if ('phase' in item) {
            return (
              <li key={item.key}>
                <span
                  aria-disabled="true"
                  className="flex min-h-10 items-center gap-3 rounded-sm px-3 font-display text-[0.6875rem] font-bold tracking-[0.08em] text-faint uppercase"
                >
                  <Icon aria-hidden className="size-4" />
                  <span className="flex-1">{t(item.key)}</span>
                  <span className="rounded-sm border border-border px-1.5 text-[0.68rem] font-semibold tracking-wider uppercase">
                    {t('phaseShort', { phase: item.phase })}
                  </span>
                </span>
              </li>
            );
          }
          const active = pathname === item.href;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-3 rounded-sm px-3 font-display text-[0.6875rem] font-bold tracking-[0.08em] uppercase transition-colors',
                  active
                    ? 'bg-card-raised text-foreground [&>svg]:text-primary'
                    : 'text-faint hover:bg-white/[0.03] hover:text-muted-foreground',
                )}
              >
                <Icon aria-hidden className="size-4" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
