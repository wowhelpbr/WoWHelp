import 'server-only';
import { mountStatusFor, type CollectionStatus } from '@wowhelp/shared';
import { cache } from 'react';
import { getCurrentUser } from '@/features/auth/session';
import type { CatalogKind } from './kinds';
import { getMyCollectionData } from './queries';

// Uma leitura da coleção por pedido, usada pelos números do topo e pela lista.
const myCollection = cache((kind: CatalogKind) => getMyCollectionData(kind));

export type StatusOf = (externalId: string) => CollectionStatus;

/** Situação de cada item para a conta logada; undefined para visitante (ou sem dados). */
export const getStatusOf = cache(async (kind: CatalogKind): Promise<StatusOf | undefined> => {
  const user = await getCurrentUser();
  if (!user) return undefined;
  const mine = await myCollection(kind);
  if (!mine) return undefined;
  const now = new Date();
  const memo = new Map<string, CollectionStatus>();
  return (id: string) => {
    let status = memo.get(id);
    if (!status) {
      status = mountStatusFor(id, mine.observations, {
        syncedAt: mine.accountSyncedAt,
        addonObservedAt: mine.addonObservedAt,
        now,
      }).status;
      memo.set(id, status);
    }
    return status;
  };
});
