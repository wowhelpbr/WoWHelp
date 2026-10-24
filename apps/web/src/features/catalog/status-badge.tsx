import type { CollectionStatus } from '@wowhelp/shared';
import { useTranslations } from 'next-intl';
import { DataStateBadge } from '@/components/ui/data-state';

/** Coletada (verde), não obtida (neutro) e desconhecido (tracejado): nunca confundir os dois últimos. */
export function MountStatusBadge({ status }: { status: CollectionStatus }) {
  const t = useTranslations('Mounts.status');
  if (status === 'collected') return <DataStateBadge state="ok" label={t('collected')} />;
  if (status === 'not_collected') return <DataStateBadge state="empty" label={t('not_collected')} />;
  return <DataStateBadge state="unknown" label={t('unknown')} />;
}

/** Etiqueta pequena sobre a imagem do card: tenho (limão), falta (cinza), desconhecida (tracejada). */
export function MountStatusChip({ status }: { status: CollectionStatus }) {
  const t = useTranslations('Mounts.status');
  if (status === 'collected') return <span className="chip chip-lime">{t('collected')}</span>;
  if (status === 'not_collected') return <span className="chip chip-grey">{t('not_collected')}</span>;
  return <span className="chip border border-dashed border-unknown/60 bg-black/40 text-unknown">{t('unknown')}</span>;
}
