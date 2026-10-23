import { CatalogItemModal } from '@/features/catalog/catalog-pages';

export default function Modal({ params }: PageProps<'/[locale]/toys/[id]'>) {
  return <CatalogItemModal kind="toy" params={params} />;
}
