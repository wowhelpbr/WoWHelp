import 'server-only';
import {
  normalizeCollectionIndex,
  normalizeCreatureDisplayId,
  normalizeItemUseText,
  normalizePetDetail,
  normalizeToyDetail,
  type CollectibleDetail,
} from '@wowhelp/shared';
import { fetchGameData } from '@/lib/blizzard/client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CatalogSyncResult } from './sync';

// Importação do catálogo oficial de mascotes e brinquedos (Game Data API,
// região US com en_US e pt_BR), em lotes e renovada a cada 7 dias, como as montarias.

const REFRESH_AFTER_DAYS = 7;
const CONCURRENCY = 5;

export type OfficialKind = 'pet' | 'toy';

const CONFIG = {
  pet: { index: '/pet/index', indexKey: 'pets', detail: (id: string) => `/pet/${id}`, normalize: normalizePetDetail },
  toy: { index: '/toy/index', indexKey: 'toys', detail: (id: string) => `/toy/${id}`, normalize: normalizeToyDetail },
} as const;

async function detailFor(
  kind: OfficialKind,
  id: string,
): Promise<{ detail: CollectibleDetail; displayId: number | null }> {
  const cfg = CONFIG[kind];
  const detail = cfg.normalize(await fetchGameData('us', cfg.detail(id)));
  if (!detail) throw new Error('detalhe inválido');
  // Mascote: a imagem renderizada vem do modelo da criatura.
  const displayId =
    kind === 'pet' && detail.creatureId
      ? normalizeCreatureDisplayId(await fetchGameData('us', `/creature/${detail.creatureId}`).catch(() => null))
      : null;
  // Brinquedo: a descrição útil é o efeito de "Usar" do item (falhou = sem descrição).
  if (kind === 'toy' && detail.itemId) {
    const use = normalizeItemUseText(await fetchGameData('us', `/item/${detail.itemId}`).catch(() => null));
    detail.descriptions = {
      'en-US': use['en-US']?.slice(0, 500) ?? null,
      'pt-BR': use['pt-BR']?.slice(0, 500) ?? null,
    };
  }
  return { detail, displayId };
}

export async function syncOfficialCollection(kind: OfficialKind, batchSize: number): Promise<CatalogSyncResult> {
  const admin = createAdminClient();
  const cfg = CONFIG[kind];
  const ids = normalizeCollectionIndex(await fetchGameData('us', cfg.index, 'en_US'), cfg.indexKey);
  if (ids.length === 0) throw new Error(`índice de ${cfg.indexKey} vazio ou em formato inesperado`);

  const existing: { external_item_id: string; fetched_at: string | null }[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await admin
      .from('collectibles')
      .select('external_item_id, fetched_at')
      .eq('kind', kind)
      .eq('source', 'blizzard_api')
      .order('external_item_id')
      .range(from, from + 999);
    if (error) throw error;
    existing.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const fresh = new Set(
    existing
      .filter((r) => r.fetched_at && Date.now() - Date.parse(r.fetched_at) < REFRESH_AFTER_DAYS * 86_400_000)
      .map((r) => r.external_item_id),
  );
  const pending = ids.filter((id) => !fresh.has(id));
  const batch = pending.slice(0, batchSize);
  let failed = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    await Promise.all(
      batch.slice(i, i + CONCURRENCY).map(async (id) => {
        try {
          const { detail, displayId } = await detailFor(kind, id);
          const { data: row, error: upsertError } = await admin
            .from('collectibles')
            .upsert(
              {
                kind,
                external_item_id: detail.id,
                source: 'blizzard_api',
                review_status: 'approved',
                fetched_at: now,
                source_type: detail.sourceType,
                faction: detail.faction,
                hidden_until_collected: detail.hiddenUntilCollected,
                category: detail.category,
                creature_display_id: displayId,
                media_ref: detail.mediaRef,
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
              category_name: detail.categoryNames[locale]?.slice(0, 60) ?? null,
            }));
          const { error: trError } = await admin
            .from('collectible_translations')
            .upsert(translations, { onConflict: 'collectible_id,locale' });
          if (trError) throw trError;
        } catch {
          failed++;
        }
      }),
    );
  }

  return { total: ids.length, processed: batch.length - failed, failed, remaining: pending.length - batch.length };
}
