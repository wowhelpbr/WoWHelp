import { CatalogItemModal } from '@/features/catalog/catalog-pages';

export default function Modal({ params }: PageProps<'/[locale]/mounts/[id]'>) {
  return <CatalogItemModal kind="mount" params={params} />;
}
