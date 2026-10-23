'use client';

import { CalendarCheck, FileUp, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

type Item = {
  key: 'overview' | 'characters' | 'collections' | 'planner' | 'addonImport' | 'settings';
  icon: LucideIcon | typeof MountGlyph;
} & ({ href: '/dashboard' | '/settings' } | { phase: number });

// Mapa de navegação da conta (planning/docs/05_WEB_PWA_E_UX.md). Seções que
// ainda não existem aparecem com a fase prevista, sem link: nada de tela falsa.
const ITEMS: Item[] = [
  { key: 'overview', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'characters', icon: Users, phase: 2 },
  { key: 'collections', icon: MountGlyph, phase: 3 },
  { key: 'planner', icon: CalendarCheck, phase: 4 },
  { key: 'addonImport', icon: FileUp, phase: 5 },
  { key: 'settings', icon: Settings, href: '/settings' },
];

/** Menu lateral da área logada (só desktop; no celular a navegação é a barra de abas). */
export function AccountSidebar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('accountNav')} className="hidden border-r border-border bg-sidebar/70 lg:block">
      <ul className="sticky top-16 flex flex-col gap-0.5 p-3 pt-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          if ('phase' in item) {
            return (
              <li key={item.key}>
                <span
                  aria-disabled="true"
                  className="flex min-h-10 items-center gap-2.5 rounded-sm px-2.5 text-sm text-muted-foreground"
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
                  'flex min-h-10 items-center gap-2.5 rounded-sm px-2.5 text-sm font-semibold transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-white/5',
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
