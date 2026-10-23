import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Locale } from '@wowhelp/shared';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env';

export interface MountEntry {
  id: string;
  externalId: string;
  expansion: string | null;
  sourceUrl: string | null;
  lastReviewedAt: string | null;
  name: string;
  summary: string | null;
}

export type CatalogResult = { status: 'ok'; mounts: MountEntry[] } | { status: 'not_configured' } | { status: 'error' };

type Row = {
  id: string;
  external_item_id: string;
  expansion: string | null;
  source_url: string | null;
  last_reviewed_at: string | null;
  collectible_translations: { locale: string; name: string; summary: string | null }[];
};

/**
 * Montarias publicadas (review_status = 'approved', garantido pela RLS).
 * Usa um cliente anônimo, sem cookies: o catálogo é público e igual para todos.
 * Se faltar tradução no idioma pedido, cai para en-US.
 */
export async function getPublishedMounts(locale: Locale): Promise<CatalogResult> {
  if (!isSupabaseConfigured()) return { status: 'not_configured' };
  const supabase = createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('collectibles')
    .select(
      'id, external_item_id, expansion, source_url, last_reviewed_at, collectible_translations(locale, name, summary)',
    )
    .eq('kind', 'mount')
    .returns<Row[]>();
  if (error || !data) return { status: 'error' };

  const mounts = data
    .map((row) => {
      const tr =
        row.collectible_translations.find((x) => x.locale === locale) ??
        row.collectible_translations.find((x) => x.locale === 'en-US');
      if (!tr) return null;
      return {
        id: row.id,
        externalId: row.external_item_id,
        expansion: row.expansion,
        sourceUrl: row.source_url,
        lastReviewedAt: row.last_reviewed_at,
        name: tr.name,
        summary: tr.summary,
      };
    })
    .filter((m): m is MountEntry => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return { status: 'ok', mounts };
}
