import type { Locale } from '@wowhelp/shared';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { MountDetail } from '@/features/catalog/mount-detail';
import { getCatalogMounts } from '@/features/catalog/queries';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: PageProps<'/[locale]/mounts/[id]'>): Promise<Metadata> {
  const { id, locale } = await params;
  const result = await getCatalogMounts(locale as Locale);
  const mount = result.status === 'ok' ? result.mounts.find((m) => m.externalId === id) : undefined;
  const t = await getTranslations('Mounts');
  return mount
    ? { title: mount.name, description: mount.summary ?? t('intro') }
    : { title: t('metaTitle'), robots: { index: false } };
}

/** Página própria da montaria (link direto ou recarregar). Do catálogo, abre como janela. */
export default async function MountPage({ params }: PageProps<'/[locale]/mounts/[id]'>) {
  const t = await getTranslations('Mounts');
  return (
    <Container className="flex flex-col gap-5 py-8 sm:py-10">
      <Link
        href="/mounts"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t('backToCatalog')}
      </Link>
      <Suspense fallback={<div className="frame h-96 animate-pulse" aria-hidden />}>
        <MountFromParams params={params} />
      </Suspense>
    </Container>
  );
}

async function MountFromParams({ params }: { params: PageProps<'/[locale]/mounts/[id]'>['params'] }) {
  await connection();
  const { id } = await params;
  return <MountDetail externalId={id} titleId="mount-title" />;
}
