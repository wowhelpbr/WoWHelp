import { CatalogItemModal } from '@/features/catalog/catalog-pages';

export default function Modal({ params }: PageProps<'/[locale]/pets/[id]'>) {
  return <CatalogItemModal kind="pet" params={params} />;
}
