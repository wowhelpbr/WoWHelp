import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { Container } from '@/components/ui/container';
import { Panel } from '@/components/ui/panel';
import { InstallApp } from '@/components/pwa/install-app';
import { getCurrentUser } from '@/features/auth/session';
import { getMyProfile } from '@/features/profile/queries';
import { SettingsForm } from '@/features/profile/settings-form';
import { redirect } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function SettingsPage() {
  const t = await getTranslations('Settings');
  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AccountSidebar />
      <Container className="flex max-w-5xl flex-col gap-6 py-8 sm:py-10">
        <h1 className="text-4xl text-foreground">{t('title')}</h1>
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <AccountSettings />
        </Suspense>
        <Panel title={t('installTitle')} titleId="install">
          <p className="mb-3 text-sm text-muted-foreground">{t('installBody')}</p>
          <InstallApp />
        </Panel>
        <Panel title={t('privacyTitle')} titleId="privacy">
          <p className="text-sm text-muted-foreground">{t('privacyBody')}</p>
        </Panel>
      </Container>
    </div>
  );
}

async function AccountSettings() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login?next=/settings', locale });
  const profile = await getMyProfile();
  return (
    <div className="frame p-4 sm:p-5">
      <SettingsForm locale={profile?.locale ?? 'en-US'} region={profile?.preferredGameRegion ?? null} />
    </div>
  );
}
