import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DataSource, Locale, StoredObservation } from '@wowhelp/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export interface MountEntry {
  id: string;
  externalId: string;
  source: 'editorial' | 'blizzard_api';
  name: string;
  summary: string | null;
  sourceType: string | null;
  sourceName: string | null;
  faction: 'ALLIANCE' | 'HORDE' | null;
  hiddenUntilCollected: boolean;
  fetchedAt: string | null;
  lastReviewedAt: string | null;
}

export type CatalogResult = { status: 'ok'; mounts: MountEntry[] } | { status: 'not_configured' } | { status: 'error' };

type Row = {
  id: string;
  external_item_id: string;
  source: 'editorial' | 'blizzard_api';
  source_type: string | null;
  faction: 'ALLIANCE' | 'HORDE' | null;
  hidden_until_collected: boolean;
  fetched_at: string | null;
  last_reviewed_at: string | null;
  collectible_translations: { locale: string; name: string; summary: string | null; source_name: string | null }[];
};

const anon = () =>
  createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/**
 * Catálogo publicado (RLS: só aprovados), igual para todos e guardado em cache
 * por 1 hora. Se faltar tradução no idioma pedido, usa o inglês.
 */
export async function getCatalogMounts(locale: Locale): Promise<CatalogResult> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');

  if (!isSupabaseConfigured()) return { status: 'not_configured' };
  const all: Row[] = [];
  // PostgREST limita o tamanho da página; lê em blocos de 1000.
  for (let from = 0; from < 10_000; from += 1000) {
    const { data, error } = await anon()
      .from('collectibles')
      .select(
        'id, external_item_id, source, source_type, faction, hidden_until_collected, fetched_at, last_reviewed_at, collectible_translations(locale, name, summary, source_name)',
      )
      .eq('kind', 'mount')
      .order('external_item_id')
      .range(from, from + 999)
      .returns<Row[]>();
    if (error || !data) return { status: 'error' };
    all.push(...data);
    if (data.length < 1000) break;
  }

  const mounts = all
    .map((row): MountEntry | null => {
      const tr =
        row.collectible_translations.find((x) => x.locale === locale) ??
        row.collectible_translations.find((x) => x.locale === 'en-US');
      if (!tr) return null;
      return {
        id: row.id,
        externalId: row.external_item_id,
        source: row.source,
        name: tr.name,
        summary: tr.summary,
        sourceType: row.source_type,
        sourceName: tr.source_name,
        faction: row.faction,
        hiddenUntilCollected: row.hidden_until_collected,
        fetchedAt: row.fetched_at,
        lastReviewedAt: row.last_reviewed_at,
      };
    })
    .filter((m): m is MountEntry => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return { status: 'ok', mounts };
}

export interface MyMountData {
  observations: StoredObservation[];
  accountSyncedAt: string | null;
}

/** Observações de coleção do usuário logado (todas as fontes) e a última sincronização. */
export async function getMyMountData(): Promise<MyMountData | null> {
  const supabase = await createClient();
  const [rows, conns] = await Promise.all([
    supabase.from('collection_states').select('external_item_id, status, source, observed_at').eq('kind', 'mount'),
    supabase.from('game_connections').select('mounts_synced_at'),
  ]);
  if (rows.error || conns.error) return null;
  const synced = (conns.data ?? [])
    .map((c) => c.mounts_synced_at as string | null)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1);
  return {
    observations: (rows.data ?? []).map((r) => ({
      externalItemId: r.external_item_id,
      status: r.status as StoredObservation['status'],
      source: r.source as DataSource,
      observedAt: r.observed_at,
    })),
    accountSyncedAt: synced ?? null,
  };
}
