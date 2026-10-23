import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { MountDetail } from '@/features/catalog/mount-detail';
import { Modal } from '@/components/ui/modal';

/** Clique num card do catálogo: a montaria abre por cima da lista (a URL vira /mounts/{id}). */
export default async function MountModal({ params }: PageProps<'/[locale]/mounts/[id]'>) {
  const t = await getTranslations('Mounts');
  return (
    <Modal closeLabel={t('close')} labelledBy="mount-modal-title">
      <Suspense fallback={<div className="h-96 animate-pulse" aria-hidden />}>
        <MountInModal params={params} />
      </Suspense>
    </Modal>
  );
}

async function MountInModal({ params }: { params: PageProps<'/[locale]/mounts/[id]'>['params'] }) {
  await connection();
  const { id } = await params;
  return <MountDetail externalId={id} titleId="mount-modal-title" />;
}
