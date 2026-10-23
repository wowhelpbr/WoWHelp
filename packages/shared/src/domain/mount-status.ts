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
  accountSync: { syncedAt: string | null; now: Date; addonObservedAt?: string | null },
): { status: CollectionStatus; source: DataSource | null; observedAt: string | null } {
  const own: CollectionObservation[] = observations
    .filter((o) => o.externalItemId === mountId)
    .map(({ status, source, observedAt }) => ({ status, source, observedAt }));

  // Fontes com lista COMPLETA do que a conta tem: Battle.net e addon Companion.
  const complete: [DataSource, string | null | undefined][] = [
    ['blizzard_api', accountSync.syncedAt],
    ['addon_import', accountSync.addonObservedAt],
  ];
  for (const [source, at] of complete) {
    const t = at ? Date.parse(at) : NaN;
    const valid =
      !Number.isNaN(t) && accountSync.now.getTime() - t <= 30 * 86_400_000 && t <= accountSync.now.getTime() + 60_000;
    if (valid && !own.some((o) => o.source === source)) {
      own.push({ status: 'not_collected', source, observedAt: at! });
    }
  }

  const resolved = resolveCollectionStatus(own);
  return { status: resolved.status, source: resolved.source, observedAt: resolved.observedAt };
}
