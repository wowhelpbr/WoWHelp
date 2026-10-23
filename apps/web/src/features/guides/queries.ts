import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Locale } from '@wowhelp/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

export type GuideKind = 'mount' | 'pet' | 'toy';

export interface GuideRow {
  kind: GuideKind;
  external_item_id: string;
  drop_chance_percent: number | null;
  chance_note_en: string | null;
  chance_note_pt: string | null;
  location_en: string | null;
  location_pt: string | null;
  how_en: string | null;
  how_pt: string | null;
  journal_encounter_id: number | null;
  source_url: string | null;
  source_label: string | null;
  status: 'draft' | 'approved';
  reviewed_at: string | null;
  updated_at: string;
}

const COLUMNS =
  'kind, external_item_id, drop_chance_percent, chance_note_en, chance_note_pt, location_en, location_pt, how_en, how_pt, journal_encounter_id, source_url, source_label, status, reviewed_at, updated_at';

/** Curadoria publicada de um item, já no idioma da página (cai para o inglês). */
export interface PublishedGuide {
  dropChancePercent: number | null;
  chanceNote: string | null;
  location: string | null;
  how: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  reviewedAt: string | null;
}

/** Só o que foi aprovado (RLS), em cache por hora; a curadoria invalida a tag "guides". */
export async function getPublishedGuide(
  kind: GuideKind,
  externalId: string,
  locale: Locale,
): Promise<PublishedGuide | null> {
  'use cache';
  cacheLife('hours');
  cacheTag('guides');
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
    .from('collectible_guides')
    .select(COLUMNS)
    .eq('kind', kind)
    .eq('external_item_id', externalId)
    .maybeSingle<GuideRow>();
  if (error || !data) return null;
  const pt = locale === 'pt-BR';
  return {
    dropChancePercent: data.drop_chance_percent === null ? null : Number(data.drop_chance_percent),
    chanceNote: (pt ? data.chance_note_pt : null) ?? data.chance_note_en,
    location: (pt ? data.location_pt : null) ?? data.location_en,
    how: (pt ? data.how_pt : null) ?? data.how_en,
    sourceUrl: data.source_url,
    sourceLabel: data.source_label,
    reviewedAt: data.reviewed_at,
  };
}

/** Curadoria (rascunho ou publicada) para a tela de edição. Só chamar depois de requireAdmin(). */
export async function getGuideForEdit(kind: GuideKind, externalId: string): Promise<GuideRow | null> {
  const { data } = await createAdminClient()
    .from('collectible_guides')
    .select(COLUMNS)
    .eq('kind', kind)
    .eq('external_item_id', externalId)
    .maybeSingle<GuideRow>();
  return data ?? null;
}

/** Situação da curadoria de todos os itens de um tipo. Só chamar depois de requireAdmin(). */
export async function getGuideStatuses(kind: GuideKind): Promise<Map<string, 'draft' | 'approved'>> {
  const map = new Map<string, 'draft' | 'approved'>();
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await createAdminClient()
      .from('collectible_guides')
      .select('external_item_id, status')
      .eq('kind', kind)
      .order('external_item_id')
      .range(from, from + 999);
    if (error) break;
    for (const r of data ?? []) map.set(r.external_item_id, r.status as 'draft' | 'approved');
    if (!data || data.length < 1000) break;
  }
  return map;
}
