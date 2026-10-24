import { ArrowLeft } from 'lucide-react';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { Modal } from '@/components/ui/modal';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { CatalogView } from './catalog-view';
import { CollectibleDetail } from './collectible-detail';
import { CATALOG_KINDS, CATALOG_PATH, type CatalogKind } from './kinds';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type IdParams = Promise<{ id: string }>;

/** Abas entre os catálogos (montarias, mascotes, brinquedos). */
async function CatalogTabs({ active }: { active: CatalogKind }) {
  const t = await getTranslations('Catalog');
  return (
    <nav aria-label={t('tabsLabel')} className="flex flex-wrap gap-x-7 border-b border-border">
      {CATALOG_KINDS.map((kind) => (
        <Link
          key={kind}
          href={CATALOG_PATH[kind]}
          aria-current={kind === active ? 'page' : undefined}
          className={cn(
            'relative -mb-px py-3 font-display text-xs font-bold tracking-[0.08em] uppercase transition-colors',
            'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary after:shadow-[0_0_18px_rgb(197_251_20/0.45),0_0_2px_rgb(197_251_20/0.9)]',
            kind === active
              ? 'text-foreground after:opacity-100'
              : 'text-faint after:opacity-0 hover:text-muted-foreground',
          )}
        >
          {t(`${kind}.tab`)}
        </Link>
      ))}
    </nav>
  );
}

/** Página de catálogo: cabeçalho, abas e a lista (em streaming). */
export async function CatalogPage({ kind, searchParams }: { kind: CatalogKind; searchParams: SearchParams }) {
  const t = await getTranslations(`Catalog.${kind}`);
  return (
    <Container className="flex flex-col gap-6 py-8 sm:py-10">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">{t('tab')}</p>
        <h1 className="text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        <p className="max-w-3xl text-muted-foreground">{t('intro')}</p>
        <p className="text-xs text-faint">{t('attribution')}</p>
      </header>
      <CatalogTabs active={kind} />
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <CatalogView kind={kind} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function DetailFromParams({ kind, params, titleId }: { kind: CatalogKind; params: IdParams; titleId: string }) {
  await connection();
  const { id } = await params;
  return <CollectibleDetail kind={kind} externalId={id} titleId={titleId} />;
}

/** Página própria do item (link direto ou recarregar). Do catálogo, abre como janela. */
export async function CatalogItemPage({ kind, params }: { kind: CatalogKind; params: IdParams }) {
  const t = await getTranslations(`Catalog.${kind}`);
  return (
    <Container className="flex flex-col gap-5 py-8 sm:py-10">
      <Link
        href={CATALOG_PATH[kind]}
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t('back')}
      </Link>
      <Suspense fallback={<div className="frame h-96 animate-pulse" aria-hidden />}>
        <DetailFromParams kind={kind} params={params} titleId="item-title" />
      </Suspense>
    </Container>
  );
}

/** Clique num card: o item abre por cima da lista (a URL vira /{tipo}/{id}). */
export async function CatalogItemModal({ kind, params }: { kind: CatalogKind; params: IdParams }) {
  const t = await getTranslations('Mounts');
  return (
    <Modal closeLabel={t('close')} labelledBy="item-modal-title">
      <Suspense fallback={<div className="h-96 animate-pulse" aria-hidden />}>
        <DetailFromParams kind={kind} params={params} titleId="item-modal-title" />
      </Suspense>
    </Modal>
  );
}
