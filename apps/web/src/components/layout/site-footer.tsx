import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/container';
import { LogoMark } from '@/components/brand/logo';
import { ConsentReopen } from '@/features/ads/ads';
import { Link } from '@/i18n/navigation';

const linkClass = 'font-display text-[0.6875rem] font-bold tracking-[0.08em] uppercase hover:text-primary';

export function SiteFooter() {
  const t = useTranslations('Footer');
  return (
    <footer className="mt-16 border-t border-border-soft bg-sidebar pb-24 md:pb-8">
      <Container className="flex flex-col gap-5 py-9 text-xs text-faint lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex gap-4 sm:gap-6">
          <LogoMark className="size-10 shrink-0" />
          <div className="flex max-w-3xl flex-col gap-2">
            <p>{t('status')}</p>
            <p>{t('disclaimer')}</p>
            <p>{t('credits')}</p>
          </div>
        </div>
        <nav aria-label={t('legalNav')} className="shrink-0 text-muted-foreground">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/supporter" className={linkClass}>
                {t('supporter')}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={linkClass}>
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                {t('terms')}
              </Link>
            </li>
            <li>
              <ConsentReopen className={linkClass} />
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
