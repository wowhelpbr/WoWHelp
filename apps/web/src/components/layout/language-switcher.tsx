'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const pathname = usePathname();
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;
  return (
    <Link
      href={pathname}
      locale={other}
      hrefLang={other}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-sm px-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
    >
      <Languages aria-hidden className="size-4" />
      <span className="hidden sm:inline">{t('switchTo')}</span>
      <span className="sm:hidden" aria-hidden>
        {t('switchToShort')}
      </span>
      <span className="sr-only sm:hidden">{t('switchTo')}</span>
    </Link>
  );
}
