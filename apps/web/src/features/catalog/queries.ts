import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { DataSource, Locale, StoredObservation } from '@wowhelp/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import type { CatalogKind } from './kinds';

export interface CatalogEntry {
  id: string;
  kind: CatalogKind;
  externalId: string;
  source: 'editorial' | 'blizzard_api';
  name: string;
  summary: string | null;
  sourceType: string | null;
  sourceName: string | null;
  faction: 'ALLIANCE' | 'HORDE' | null;
  hiddenUntilCollected: boolean;
  /** Tipo do item (mascote: BEAST...) e o nome traduzido que a API deu. */
  category: string | null;
  categoryName: string | null;
  fetchedAt: string | null;
  lastReviewedAt: string | null;
  /** Cópia própria da imagem oficial (Storage), ou null se ainda não existe. */
  imageUrl: string | null;
}

/** Nome antigo, mantido enquanto as montarias usam os mesmos componentes. */
export type MountEntry = CatalogEntry;

export type CatalogResult =
  { status: 'ok'; items: CatalogEntry[] } | { status: 'not_configured' } | { status: 'error' };

type Row = {
  id: string;
  external_item_id: string;
  source: 'editorial' | 'blizzard_api';
  source_type: string | null;
  faction: 'ALLIANCE' | 'HORDE' | null;
  hidden_until_collected: boolean;
  category: string | null;
  fetched_at: string | null;
  last_reviewed_at: string | null;
  media_path: string | null;
  media_fetched_at: string | null;
  collectible_translations: {
    locale: string;
    name: string;
    summary: string | null;
    source_name: string | null;
    category_name: string | null;
  }[];
};

/** URL pública do bucket; o ?v= troca quando a imagem é renovada (o arquivo fica em cache por 1 dia). */
function mediaUrl(path: string | null, fetchedAt: string | null): string | null {
  if (!path) return null;
  const v = fetchedAt ? `?v=${Date.parse(fetchedAt).toString(36)}` : '';
  return `${supabaseUrl}/storage/v1/object/public/catalog-media/${path}${v}`;
}

const anon = () =>
  createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/**
 * Catálogo publicado de um tipo (RLS: só aprovados), igual para todos e
 * guardado em cache por 1 hora. Se faltar tradução no idioma pedido, usa o inglês.
 */
export async function getCatalog(kind: CatalogKind, locale: Locale): Promise<CatalogResult> {
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
        'id, external_item_id, source, source_type, faction, hidden_until_collected, category, fetched_at, last_reviewed_at, media_path, media_fetched_at, collectible_translations(locale, name, summary, source_name, category_name)',
      )
      .eq('kind', kind)
      .order('external_item_id')
      .range(from, from + 999)
      .returns<Row[]>();
    if (error || !data) return { status: 'error' };
    all.push(...data);
    if (data.length < 1000) break;
  }

  const items = all
    .map((row): CatalogEntry | null => {
      const tr =
        row.collectible_translations.find((x) => x.locale === locale) ??
        row.collectible_translations.find((x) => x.locale === 'en-US');
      if (!tr) return null;
      return {
        id: row.id,
        kind,
        externalId: row.external_item_id,
        source: row.source,
        name: tr.name,
        summary: tr.summary,
        sourceType: row.source_type,
        sourceName: tr.source_name,
        faction: row.faction,
        hiddenUntilCollected: row.hidden_until_collected,
        category: row.category,
        categoryName: tr.category_name,
        fetchedAt: row.fetched_at,
        lastReviewedAt: row.last_reviewed_at,
        imageUrl: mediaUrl(row.media_path, row.media_fetched_at),
      };
    })
    .filter((m): m is CatalogEntry => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return { status: 'ok', items };
}

export const getCatalogMounts = (locale: Locale) => getCatalog('mount', locale);

export interface MyCollectionData {
  observations: StoredObservation[];
  /** Última leitura completa da coleção pela Battle.net (todas as regiões). */
  accountSyncedAt: string | null;
  /** Quando o addon leu a coleção completa pela última vez (só montarias por enquanto). */
  addonObservedAt: string | null;
}

/** Nome antigo. */
export type MyMountData = MyCollectionData;

const SYNC_COLUMN: Record<CatalogKind, 'mounts_synced_at' | 'pets_synced_at' | 'toys_synced_at'> = {
  mount: 'mounts_synced_at',
  pet: 'pets_synced_at',
  toy: 'toys_synced_at',
};

/** Observações de coleção do usuário logado (todas as fontes) e as últimas leituras completas. */
export async function getMyCollectionData(kind: CatalogKind): Promise<MyCollectionData | null> {
  const supabase = await createClient();
  const column = SYNC_COLUMN[kind];
  const [conns, addon] = await Promise.all([
    supabase.from('game_connections').select(column),
    kind === 'mount'
      ? supabase
          .from('addon_imports')
          .select('mounts_observed_at')
          .contains('categories', ['mounts'])
          .not('mounts_observed_at', 'is', null)
          .order('mounts_observed_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as { mounts_observed_at: string }[], error: null }),
  ]);
  if (conns.error || addon.error) return null;

  // Colecionadores passam de 1000 itens; a API do Supabase devolve no máximo
  // 1000 linhas por consulta. Sem paginar, o resto viraria "não obtido".
  type ObsRow = { external_item_id: string; status: string; source: string; observed_at: string };
  const rows: ObsRow[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const page = await supabase
      .from('collection_states')
      .select('external_item_id, status, source, observed_at')
      .eq('kind', kind)
      .order('id')
      .range(from, from + 999);
    if (page.error) return null;
    rows.push(...((page.data ?? []) as ObsRow[]));
    if ((page.data ?? []).length < 1000) break;
  }

  const synced = ((conns.data ?? []) as Record<string, string | null>[])
    .map((c) => c[column] ?? null)
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

export const getMyMountData = () => getMyCollectionData('mount');
