import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { StateNotice } from '@/components/ui/data-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return { title: t('confirmErrorTitle'), robots: { index: false } };
}

export default function AuthErrorPage() {
  const t = useTranslations('Auth');
  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-3xl text-foreground">{t('confirmErrorTitle')}</h1>
        <StateNotice
          state="sync_failed"
          title={t('confirmErrorTitle')}
          action={
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/login">{t('submitSignIn')}</ButtonLink>
              <ButtonLink href="/signup" variant="secondary">
                {t('submitSignUp')}
              </ButtonLink>
            </div>
          }
        >
          {t('confirmErrorBody')}
        </StateNotice>
      </div>
    </Container>
  );
}
