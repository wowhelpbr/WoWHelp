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
