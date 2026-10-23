import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminCatalogEdit } from '@/features/admin/catalog-admin-edit';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin');
  return { title: t('editTitle'), robots: { index: false, follow: false } };
}

export default function Page({ params }: PageProps<'/[locale]/admin/mounts/[id]'>) {
  return <AdminCatalogEdit kind="mount" params={params} />;
}
