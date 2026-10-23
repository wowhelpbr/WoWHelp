import { resolveCollectionStatus, type CollectionObservation } from './collection';
import type { CollectionStatus, DataSource } from './enums';

export interface StoredObservation {
  externalItemId: string;
  status: CollectionStatus;
  source: DataSource;
  observedAt: string;
}

/**
 * Status de uma montaria para o jogador.
 *
 * A coleção da conta vinda da Blizzard lista só o que o jogador TEM. Por isso,
 * uma montaria ausente dessa lista só conta como "não obtida" se houve uma
 * sincronização completa e ainda válida (dentro de 30 dias). Sem isso, ausência
 * é "desconhecido" (regra central do produto: ausência não prova ausência).
 */
export function mountStatusFor(
  mountId: string,
  observations: readonly StoredObservation[],
  accountSync: { syncedAt: string | null; now: Date },
): { status: CollectionStatus; source: DataSource | null; observedAt: string | null } {
  const own: CollectionObservation[] = observations
    .filter((o) => o.externalItemId === mountId)
    .map(({ status, source, observedAt }) => ({ status, source, observedAt }));

  const syncedAt = accountSync.syncedAt ? Date.parse(accountSync.syncedAt) : NaN;
  const syncValid =
    !Number.isNaN(syncedAt) &&
    accountSync.now.getTime() - syncedAt <= 30 * 86_400_000 &&
    syncedAt <= accountSync.now.getTime() + 60_000;

  if (syncValid && !own.some((o) => o.source === 'blizzard_api')) {
    own.push({ status: 'not_collected', source: 'blizzard_api', observedAt: accountSync.syncedAt! });
  }

  const resolved = resolveCollectionStatus(own);
  return { status: resolved.status, source: resolved.source, observedAt: resolved.observedAt };
}
