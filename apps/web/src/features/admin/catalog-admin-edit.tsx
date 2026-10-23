import type { Locale } from '@wowhelp/shared';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/features/admin/session';
import { CATALOG_PATH, IMAGE_MODE, type CatalogKind } from '@/features/catalog/kinds';
import { getCatalog } from '@/features/catalog/queries';
import { TiltStage } from '@/features/catalog/tilt-stage';
import { GuideForm } from '@/features/guides/guide-form';
import { getGuideForEdit } from '@/features/guides/queries';
import { Link } from '@/i18n/navigation';

type IdParams = Promise<{ id: string }>;

/** Edição da curadoria de um item. */
export function AdminCatalogEdit({ kind, params }: { kind: CatalogKind; params: IdParams }) {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-96 animate-pulse" aria-hidden />}>
        <Edit kind={kind} params={params} />
      </Suspense>
    </Container>
  );
}

async function Edit({ kind, params }: { kind: CatalogKind; params: IdParams }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d{1,20}$/.test(id)) notFound();
  const locale = (await getLocale()) as Locale;
  const [catalog, guide, t] = await Promise.all([
    getCatalog(kind, locale),
    getGuideForEdit(kind, id),
    getTranslations('Admin'),
  ]);
  const mount = catalog.status === 'ok' ? catalog.items.find((m) => m.externalId === id) : undefined;
  if (!mount) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin${CATALOG_PATH[kind]}`} className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToList')}
      </Link>
      <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3">
          <TiltStage imageUrl={mount.imageUrl} imageMode={IMAGE_MODE[kind]} placeholder={kind} />
          <h1 className="text-3xl text-foreground">{mount.name}</h1>
          <p className="text-sm text-muted-foreground">
            #{mount.externalId} · {mount.sourceName ?? t('noSource')}
          </p>
          {mount.summary && <p className="text-sm text-foreground">{mount.summary}</p>}
          <Link
            href={`${CATALOG_PATH[kind]}/${mount.externalId}`}
            className="text-sm text-neon underline underline-offset-2"
          >
            {t('viewPublic')}
          </Link>
        </aside>
        <section aria-label={t('editTitle')} className="frame p-5">
          <GuideForm kind={kind} externalId={mount.externalId} guide={guide} />
        </section>
      </div>
    </div>
  );
}
