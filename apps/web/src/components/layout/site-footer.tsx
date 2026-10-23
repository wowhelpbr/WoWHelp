import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/container';
import { LogoMark } from '@/components/brand/logo';

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
        </div>
      </Container>
    </footer>
  );
}
