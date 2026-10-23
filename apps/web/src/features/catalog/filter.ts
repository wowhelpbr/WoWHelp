import type { CollectionStatus } from '@wowhelp/shared';
import type { MountEntry } from './queries';

export interface MountFilters {
  q: string;
  source: string;
  faction: '' | 'ALLIANCE' | 'HORDE';
  status: '' | CollectionStatus;
}

export const PAGE_SIZE = 60;

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Lê os filtros da URL aceitando só valores conhecidos. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): MountFilters & { page: number } {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const faction = one('faction');
  const status = one('status');
  const page = Number(one('page') || 1);
  return {
    q: one('q').slice(0, 80),
    source: /^[A-Z_]{1,32}$/.test(one('source')) ? one('source') : '',
    faction: faction === 'ALLIANCE' || faction === 'HORDE' ? faction : '',
    status: status === 'collected' || status === 'not_collected' || status === 'unknown' ? status : '',
    page: Number.isInteger(page) && page > 0 && page < 1000 ? page : 1,
  };
}

/**
 * Montarias "escondidas até coletar" (should_exclude_if_uncollected na API)
 * só aparecem para quem já tem. Facção mostra o que aquela facção pode usar:
 * as neutras e as da própria facção.
 */
export function filterMounts(
  mounts: readonly MountEntry[],
  f: MountFilters,
  statusOf?: (externalId: string) => CollectionStatus,
): MountEntry[] {
  const q = fold(f.q.trim());
  return mounts.filter((m) => {
    const status = statusOf?.(m.externalId);
    if (m.hiddenUntilCollected && status !== 'collected') return false;
    if (q && !fold(m.name).includes(q)) return false;
    if (f.source && m.sourceType !== f.source) return false;
    if (f.faction && m.faction !== null && m.faction !== f.faction) return false;
    if (f.status && statusOf && status !== f.status) return false;
    return true;
  });
}

/** Origens presentes no catálogo, com o rótulo traduzido que a própria API deu. */
export function sourceOptions(mounts: readonly MountEntry[]): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const m of mounts) {
    if (m.sourceType && !seen.has(m.sourceType)) seen.set(m.sourceType, m.sourceName ?? m.sourceType);
  }
  return [...seen.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}
