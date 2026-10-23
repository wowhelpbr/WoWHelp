import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { Logo } from '@/components/brand/logo';
import { gutter } from '@/components/ui/container';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { AccountSlot, AccountSlotFallback } from './account-slot';
import { LanguageSwitcher } from './language-switcher';
import { NavLinks } from './nav-links';

/** Barra de ponta a ponta, fixa no topo. */
export function SiteHeader() {
  const t = useTranslations('Nav');
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-sidebar/85 backdrop-blur-md">
      <div className={cn('flex h-16 items-center justify-between gap-3', gutter)}>
        <div className="flex h-full min-w-0 items-center gap-5 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <Logo priority />
          </Link>
          <nav aria-label={t('main')} className="flex h-full">
            <NavLinks />
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <Suspense fallback={<AccountSlotFallback />}>
            <AccountSlot />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
