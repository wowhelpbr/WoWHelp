import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Panel } from '@/components/ui/panel';
import { getCurrentUser } from '@/features/auth/session';
import { CreatorRequestForm } from '@/features/community/request-form';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Community.request');
  return { title: t('metaTitle') };
}

export default async function JoinPage() {
  const t = await getTranslations('Community.request');
  return (
    <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col gap-3">
        <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground">
          {t('back')}
        </Link>
        <h1 className="text-4xl text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground marker:text-neon">
          <li>{t('rule1')}</li>
          <li>{t('rule2')}</li>
          <li>{t('rule3')}</li>
        </ul>
      </div>
      <Panel title={t('formTitle')} titleId="request-form" className="corner-brackets">
        <Suspense fallback={<div className="h-64 animate-pulse" aria-hidden />}>
          <RequestArea />
        </Suspense>
      </Panel>
    </Container>
  );
}

async function RequestArea() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations('Community.request')]);
  if (!user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t('signIn')}</p>
        <ButtonLink href="/login?next=/community/join" className="self-start">
          {t('signInCta')}
        </ButtonLink>
      </div>
    );
  }
  return <CreatorRequestForm />;
}
