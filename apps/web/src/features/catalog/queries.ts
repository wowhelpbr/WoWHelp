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
  /** Quando o addon leu a coleção completa pela última vez (importação mais recente). */
  addonObservedAt: string | null;
}

/** Observações de coleção do usuário logado (todas as fontes) e as últimas leituras completas. */
export async function getMyMountData(): Promise<MyMountData | null> {
  const supabase = await createClient();
  const [conns, addon] = await Promise.all([
    supabase.from('game_connections').select('mounts_synced_at'),
    supabase
      .from('addon_imports')
      .select('mounts_observed_at')
      .contains('categories', ['mounts'])
      .not('mounts_observed_at', 'is', null)
      .order('mounts_observed_at', { ascending: false })
      .limit(1),
  ]);
  if (conns.error || addon.error) return null;

  // Colecionadores passam de 1000 montarias; a API do Supabase devolve no
  // máximo 1000 linhas por consulta. Sem paginar, o resto viraria "não obtida".
  type Row = { external_item_id: string; status: string; source: string; observed_at: string };
  const rows: Row[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const page = await supabase
      .from('collection_states')
      .select('external_item_id, status, source, observed_at')
      .eq('kind', 'mount')
      .order('id')
      .range(from, from + 999);
    if (page.error) return null;
    rows.push(...((page.data ?? []) as Row[]));
    if ((page.data ?? []).length < 1000) break;
  }

  const synced = (conns.data ?? [])
    .map((c) => c.mounts_synced_at as string | null)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1);
  return {
    observations: rows.map((r) => ({
      externalItemId: r.external_item_id,
      status: r.status as StoredObservation['status'],
      source: r.source as DataSource,
      observedAt: r.observed_at,
    })),
    accountSyncedAt: synced ?? null,
    addonObservedAt: (addon.data?.[0]?.mounts_observed_at as string | undefined) ?? null,
  };
}
