import type { Locale } from '@wowhelp/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/features/admin/session';
import { getCatalogMounts } from '@/features/catalog/queries';
import { TiltStage } from '@/features/catalog/tilt-stage';
import { GuideForm } from '@/features/guides/guide-form';
import { getGuideForEdit } from '@/features/guides/queries';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin');
  return { title: t('editTitle'), robots: { index: false, follow: false } };
}

export default function AdminMountPage({ params }: PageProps<'/[locale]/admin/mounts/[id]'>) {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-96 animate-pulse" aria-hidden />}>
        <EditMount params={params} />
      </Suspense>
    </Container>
  );
}

async function EditMount({ params }: { params: PageProps<'/[locale]/admin/mounts/[id]'>['params'] }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d{1,20}$/.test(id)) notFound();
  const locale = (await getLocale()) as Locale;
  const [catalog, guide, t] = await Promise.all([
    getCatalogMounts(locale),
    getGuideForEdit('mount', id),
    getTranslations('Admin'),
  ]);
  const mount = catalog.status === 'ok' ? catalog.mounts.find((m) => m.externalId === id) : undefined;
  if (!mount) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/mounts" className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToMounts')}
      </Link>
      <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3">
          <TiltStage imageUrl={mount.imageUrl} />
          <h1 className="text-3xl text-foreground">{mount.name}</h1>
          <p className="text-sm text-muted-foreground">
            #{mount.externalId} · {mount.sourceName ?? t('noSource')}
          </p>
          {mount.summary && <p className="text-sm text-foreground">{mount.summary}</p>}
          <Link href={`/mounts/${mount.externalId}`} className="text-sm text-neon underline underline-offset-2">
            {t('viewPublic')}
          </Link>
        </aside>
        <section aria-label={t('editTitle')} className="frame p-5">
          <GuideForm kind="mount" externalId={mount.externalId} guide={guide} />
        </section>
      </div>
    </div>
  );
}
