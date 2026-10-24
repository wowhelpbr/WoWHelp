import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/container';
import { LogoMark } from '@/components/brand/logo';
import { ConsentReopen } from '@/features/ads/ads';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations('Footer');
  return (
    <footer className="mt-16 border-t border-border/50 pb-24 md:pb-8">
      <Container className="flex flex-col gap-3 py-8 text-xs text-muted-foreground sm:flex-row sm:items-start sm:gap-6">
        <LogoMark className="size-10 shrink-0" />
        <div className="flex max-w-3xl flex-col gap-2">
          <p>{t('status')}</p>
          <p>{t('disclaimer')}</p>
          <p>{t('credits')}</p>
          <nav aria-label={t('legalNav')}>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              <li>
                <Link href="/supporter" className="underline underline-offset-2 hover:text-foreground">
                  {t('supporter')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <ConsentReopen className="underline underline-offset-2 hover:text-foreground" />
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
