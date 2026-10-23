import 'server-only';
import { normalizeMountDetail, normalizeMountIndex } from '@wowhelp/shared';
import { fetchGameData } from '@/lib/blizzard/client';
import { createAdminClient } from '@/lib/supabase/admin';

// Importação do catálogo oficial de montarias (Game Data API, região US, que
// tem en_US e pt_BR). Roda em lotes para caber no tempo de uma função da
// Vercel; cada item é renovado a cada 7 dias, bem antes do limite de 30.

const REFRESH_AFTER_DAYS = 7;
const CONCURRENCY = 5;

export interface CatalogSyncResult {
  total: number;
  processed: number;
  failed: number;
  remaining: number;
}

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

export async function syncOfficialMounts(batchSize: number): Promise<CatalogSyncResult> {
  const admin = createAdminClient();
  const ids = normalizeMountIndex(await fetchGameData('us', '/mount/index', 'en_US'));
  if (ids.length === 0) throw new Error('índice de montarias vazio ou em formato inesperado');

  // A API do Supabase devolve no máximo 1000 linhas por consulta: lê em páginas.
  const existing: { external_item_id: string; fetched_at: string | null }[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await admin
      .from('collectibles')
      .select('external_item_id, fetched_at')
      .eq('kind', 'mount')
      .eq('source', 'blizzard_api')
      .order('external_item_id')
      .range(from, from + 999);
    if (error) throw error;
    existing.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const fresh = new Set(
    (existing ?? [])
      .filter((r) => r.fetched_at && Date.now() - Date.parse(r.fetched_at) < REFRESH_AFTER_DAYS * 86_400_000)
      .map((r) => r.external_item_id),
  );
  const pending = ids.filter((id) => !fresh.has(id));
  const batch = pending.slice(0, batchSize);
  let failed = 0;
  const now = new Date().toISOString();

  await inBatches(batch, CONCURRENCY, async (id) => {
    try {
      // Sem locale: a resposta traz todos os idiomas de uma vez.
      const detail = normalizeMountDetail(await fetchGameData('us', `/mount/${id}`));
      if (!detail) throw new Error('detalhe inválido');

      const { data: row, error: upsertError } = await admin
        .from('collectibles')
        .upsert(
          {
            kind: 'mount',
            external_item_id: detail.id,
            source: 'blizzard_api',
            review_status: 'approved',
            fetched_at: now,
            source_type: detail.sourceType,
            faction: detail.faction,
            hidden_until_collected: detail.hiddenUntilCollected,
            creature_display_id: detail.creatureDisplayId,
          },
          { onConflict: 'kind,external_item_id' },
        )
        .select('id')
        .single();
      if (upsertError || !row) throw upsertError ?? new Error('sem id');

      const translations = (['en-US', 'pt-BR'] as const)
        .filter((locale) => detail.names[locale])
        .map((locale) => ({
          collectible_id: row.id,
          locale,
          name: detail.names[locale]!.slice(0, 160),
          summary: detail.descriptions[locale],
          source_name: detail.sourceNames[locale]?.slice(0, 120) ?? null,
        }));
      const { error: trError } = await admin
        .from('collectible_translations')
        .upsert(translations, { onConflict: 'collectible_id,locale' });
      if (trError) throw trError;
    } catch {
      failed++;
    }
  });

  return { total: ids.length, processed: batch.length - failed, failed, remaining: pending.length - batch.length };
}
