'use server';

import { createHash } from 'node:crypto';
import { readAddonSnapshot, type AddonReadResult, type AddonSnapshot } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/session';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Limite do texto recebido (o arquivo real do Companion tem poucos KB).
const MAX_CHARS = 512 * 1024;

export type ImportPreview =
  | {
      ok: true;
      addonVersion: string;
      observedAt: string | null;
      region: AddonSnapshot['region'];
      characters: { name: string; realm: string | null; level: number | null; className: string | null }[];
      mountsCount: number | null;
      alreadyImported: boolean;
    }
  | { ok: false; code: Extract<AddonReadResult, { ok: false }>['code'] | 'unauthenticated' | 'empty' };

const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/** Lê o arquivo (sem executar Lua) e devolve só a prévia. Nada é gravado aqui. */
export async function previewAddonImportAction(text: string): Promise<ImportPreview> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: 'unauthenticated' };
  if (typeof text !== 'string' || text.trim().length === 0) return { ok: false, code: 'empty' };
  if (text.length > MAX_CHARS) return { ok: false, code: 'too_large' };

  const result = readAddonSnapshot(text);
  if (!result.ok) return { ok: false, code: result.code };
  const s = result.snapshot;

  const supabase = await createClient();
  const { count } = await supabase
    .from('addon_imports')
    .select('id', { count: 'exact', head: true })
    .eq('payload_sha256', hash(text));

  return {
    ok: true,
    addonVersion: s.addonVersion,
    observedAt: s.observedAt,
    region: s.region,
    characters: s.characters.map((c) => ({ name: c.name, realm: c.realm, level: c.level, className: c.className })),
    mountsCount: s.mounts ? s.mounts.ids.length : null,
    alreadyImported: (count ?? 0) > 0,
  };
}

export type ImportResult =
  | { ok: true; characters: number; mounts: number | null }
  | { ok: false; code: 'unauthenticated' | 'invalid' | 'duplicate' | 'no_region' | 'not_configured' | 'storage' };

const categoriesSchema = z
  .array(z.enum(['characters', 'mounts']))
  .min(1)
  .max(2);

/**
 * Confirma a importação: lê de novo (nunca confia na prévia do navegador),
 * grava o histórico e só as categorias escolhidas, sempre com o user_id da sessão.
 */
export async function confirmAddonImportAction(text: string, categoriesInput: string[]): Promise<ImportResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: 'unauthenticated' };
  if (!isAdminConfigured()) return { ok: false, code: 'not_configured' };
  const categories = categoriesSchema.safeParse([...new Set(categoriesInput)]);
  if (typeof text !== 'string' || text.length > MAX_CHARS || !categories.success) return { ok: false, code: 'invalid' };

  const result = readAddonSnapshot(text);
  if (!result.ok) return { ok: false, code: 'invalid' };
  const s = result.snapshot;
  const wantsCharacters = categories.data.includes('characters');
  const wantsMounts = categories.data.includes('mounts');
  if (wantsCharacters && s.characters.length > 0 && !s.region) return { ok: false, code: 'no_region' };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: importError } = await admin.from('addon_imports').insert({
    user_id: user.id,
    schema_version: 1,
    addon_version: s.addonVersion,
    observed_at: s.observedAt,
    region: s.region,
    characters_count: wantsCharacters ? s.characters.length : 0,
    mounts_count: wantsMounts && s.mounts ? s.mounts.ids.length : null,
    mounts_observed_at: wantsMounts && s.mounts ? (s.mounts.observedAt ?? s.observedAt ?? now) : null,
    categories: categories.data,
    payload_sha256: hash(text),
  });
  if (importError) return { ok: false, code: importError.code === '23505' ? 'duplicate' : 'storage' };

  let charactersSaved = 0;
  if (wantsCharacters && s.region && s.characters.length > 0) {
    const rows = s.characters.map((c) => ({
      user_id: user.id,
      source: 'addon_import',
      region: s.region,
      realm_slug: (c.realmSlug ?? c.realm ?? 'unknown').slice(0, 64),
      realm_name: c.realm,
      external_character_id: c.guid,
      name: c.name,
      level: c.level,
      class_id: c.classId,
      class_name: c.className,
      race_id: c.raceId,
      race_name: c.raceName,
      faction: c.faction,
      fetched_at: c.observedAt ?? now,
    }));
    // Substitui os mesmos personagens (por GUID) de importações anteriores.
    const { error: delError } = await admin
      .from('characters')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'addon_import')
      .eq('region', s.region)
      .in(
        'external_character_id',
        rows.map((r) => r.external_character_id),
      );
    if (delError) return { ok: false, code: 'storage' };
    const { error } = await admin.from('characters').insert(rows);
    if (error) return { ok: false, code: 'storage' };
    charactersSaved = rows.length;
  }

  let mountsSaved: number | null = null;
  if (wantsMounts && s.mounts) {
    const observedAt = s.mounts.observedAt ?? s.observedAt ?? now;
    await admin
      .from('collection_states')
      .delete()
      .eq('user_id', user.id)
      .eq('kind', 'mount')
      .eq('source', 'addon_import');
    if (s.mounts.ids.length > 0) {
      const { error } = await admin.from('collection_states').insert(
        s.mounts.ids.map((id) => ({
          user_id: user.id,
          kind: 'mount',
          external_item_id: id,
          status: 'collected',
          source: 'addon_import',
          observed_at: observedAt,
          fetched_at: now,
        })),
      );
      if (error) return { ok: false, code: 'storage' };
    }
    mountsSaved = s.mounts.ids.length;
  }

  refresh();
  return { ok: true, characters: charactersSaved, mounts: mountsSaved };
}

/** Apaga tudo que veio do addon (personagens, coleção e histórico). */
export async function deleteAddonDataAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from('characters').delete().eq('source', 'addon_import');
  await supabase.from('collection_states').delete().eq('source', 'addon_import');
  await supabase.from('addon_imports').delete().not('id', 'is', null);
  refresh();
}
