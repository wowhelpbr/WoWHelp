import { COLLECTION_STATUSES, isOneOf, type CollectionStatus, type DataSource } from './enums';

export interface CollectionObservation {
  status: CollectionStatus;
  source: DataSource;
  /** Momento em que a fonte observou o dado (ISO 8601 UTC). */
  observedAt: string;
}

/**
 * Converte qualquer valor vindo de fonte externa num status tri-state.
 * Valores ausentes ou desconhecidos viram 'unknown', nunca 'not_collected'.
 */
export function normalizeCollectionStatus(value: unknown): CollectionStatus {
  return isOneOf(COLLECTION_STATUSES, value) ? value : 'unknown';
}

const SOURCE_TRUST: Record<DataSource, number> = {
  blizzard_api: 3,
  addon_import: 2,
  manual: 1,
  editorial: 0,
};

/**
 * Escolhe a observação que vale para exibição.
 * Regras: 'unknown' nunca sobrescreve um estado conhecido; entre estados
 * conhecidos vence o mais recente e, em empate de horário, a fonte mais
 * confiável. Sem observações, o resultado é 'unknown'.
 */
export function resolveCollectionStatus(
  observations: readonly CollectionObservation[],
): CollectionObservation | { status: 'unknown'; source: null; observedAt: null } {
  const known = observations.filter((o) => o.status !== 'unknown' && !Number.isNaN(Date.parse(o.observedAt)));
  if (known.length === 0) {
    return { status: 'unknown', source: null, observedAt: null };
  }
  return [...known].sort((a, b) => {
    const byTime = Date.parse(b.observedAt) - Date.parse(a.observedAt);
    return byTime !== 0 ? byTime : SOURCE_TRUST[b.source] - SOURCE_TRUST[a.source];
  })[0]!;
}

export type Freshness = 'fresh' | 'stale' | 'unknown';

/** Classifica a idade de um dado sincronizado. Sem data, é 'unknown'. */
export function getFreshness(fetchedAt: string | null | undefined, now: Date, maxAgeHours: number): Freshness {
  if (!fetchedAt) return 'unknown';
  const fetched = Date.parse(fetchedAt);
  if (Number.isNaN(fetched)) return 'unknown';
  return now.getTime() - fetched <= maxAgeHours * 3_600_000 ? 'fresh' : 'stale';
}
