import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/features/admin/session';
import { SiteSettingsForm } from '@/features/admin/site-settings-form';
import { Link } from '@/i18n/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin.site');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default function AdminSitePage() {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <AdminSite />
      </Suspense>
    </Container>
  );
}

async function AdminSite() {
  await requireAdmin();
  const [t, { data }] = await Promise.all([
    getTranslations('Admin.site'),
    createAdminClient().from('site_settings').select('private, password_hash').eq('id', true).single(),
  ]);
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-4xl text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </header>
      <section className="frame corner-brackets p-5">
        <SiteSettingsForm isPrivate={data?.private === true} hasPassword={Boolean(data?.password_hash)} />
      </section>
      <p className="text-xs text-muted-foreground">{t('note')}</p>
    </div>
  );
}
