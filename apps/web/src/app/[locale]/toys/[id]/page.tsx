import type { Locale } from '@wowhelp/shared';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CatalogItemPage } from '@/features/catalog/catalog-pages';
import { getCatalog } from '@/features/catalog/queries';

export async function generateMetadata({ params }: PageProps<'/[locale]/toys/[id]'>): Promise<Metadata> {
  const { id, locale } = await params;
  const result = await getCatalog('toy', locale as Locale);
  const item = result.status === 'ok' ? result.items.find((m) => m.externalId === id) : undefined;
  const t = await getTranslations('Catalog.toy');
  return item
    ? { title: item.name, description: item.summary ?? t('intro') }
    : { title: t('metaTitle'), robots: { index: false } };
}

export default function Page({ params }: PageProps<'/[locale]/toys/[id]'>) {
  return <CatalogItemPage kind="toy" params={params} />;
}
