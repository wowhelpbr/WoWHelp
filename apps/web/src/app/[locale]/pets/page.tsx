import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CatalogPage } from '@/features/catalog/catalog-pages';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Catalog.pet');
  return { title: t('metaTitle'), description: t('intro') };
}

export default function Page({ searchParams }: PageProps<'/[locale]/pets'>) {
  return <CatalogPage kind="pet" searchParams={searchParams} />;
}
