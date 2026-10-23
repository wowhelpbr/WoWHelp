import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminCatalogList } from '@/features/admin/catalog-admin-list';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Catalog.mount');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default function Page({ searchParams }: PageProps<'/[locale]/admin/mounts'>) {
  return <AdminCatalogList kind="mount" searchParams={searchParams} />;
}
