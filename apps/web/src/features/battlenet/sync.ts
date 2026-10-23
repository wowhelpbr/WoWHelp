import 'server-only';
import {
  apiLocaleFor,
  normalizeAccountMounts,
  normalizeProfileCharacters,
  normalizeUserInfo,
  type BattlenetRegion,
  type Locale,
} from '@wowhelp/shared';
import { BlizzardError, exchangeCode, fetchAccountProfile, fetchUserInfo } from '@/lib/blizzard/client';
import { createAdminClient } from '@/lib/supabase/admin';

export type SyncResult =
  | { ok: true; characters: number; mounts: number | null }
  | { ok: false; code: 'denied' | 'token' | 'profile' | 'storage' | 'not_configured' };

/**
 * Fluxo completo depois que o jogador autorizou: troca o código, lê a conta,
 * grava personagens e montarias e descarta o token. Chamado só pela rota de
 * retorno, depois de conferir o state e a sessão; userId vem da sessão.
 */
export async function syncFromAuthorization(input: {
  userId: string;
  region: BattlenetRegion;
  locale: Locale;
  code: string;
  redirectUri: string;
}): Promise<SyncResult> {
  const { userId, region } = input;
  const apiLocale = apiLocaleFor(region, input.locale);

  let token: string;
  let scopes: string[] = [];
  try {
    const t = await exchangeCode(input.code, input.redirectUri);
    token = t.access_token;
    scopes = (t.scope ?? '').split(/\s+/).filter(Boolean).slice(0, 10);
  } catch (e) {
    return { ok: false, code: e instanceof BlizzardError && e.code === 'not_configured' ? 'not_configured' : 'token' };
  }

  const user = normalizeUserInfo(await fetchUserInfo(token).catch(() => null));
  if (!user) return { ok: false, code: 'token' };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: connection, error: connError } = await admin
    .from('game_connections')
    .upsert(
      {
        user_id: userId,
        provider: 'battlenet',
        region,
        external_account_ref: user.accountId,
        battletag: user.battletag,
        granted_scopes: scopes,
        status: 'connected',
        last_sync_error: null,
      },
      { onConflict: 'user_id,provider,region' },
    )
    .select('id')
    .single();
  if (connError || !connection) return { ok: false, code: 'storage' };

  // Personagens: substitui a lista daquela região por completo.
  let characters;
  try {
    characters = normalizeProfileCharacters(await fetchAccountProfile(region, token, apiLocale), apiLocale);
  } catch {
    await admin
      .from('game_connections')
      .update({ status: 'sync_failed', last_sync_error: 'profile' })
      .eq('id', connection.id);
    return { ok: false, code: 'profile' };
  }

  const { error: delError } = await admin
    .from('characters')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'blizzard_api')
    .eq('region', region);
  if (delError) return { ok: false, code: 'storage' };

  if (characters.length > 0) {
    const { error } = await admin.from('characters').insert(
      characters.slice(0, 200).map((c) => ({
        user_id: userId,
        connection_id: connection.id,
        source: 'blizzard_api',
        region,
        realm_slug: c.realmSlug,
        realm_name: c.realmName,
        external_character_id: c.externalId,
        name: c.name,
        level: c.level,
        class_id: c.classId,
        class_name: c.className,
        race_id: c.raceId,
        race_name: c.raceName,
        faction: c.faction,
        fetched_at: now,
      })),
    );
    if (error) return { ok: false, code: 'storage' };
  }

  // Montarias da conta. Se esta parte falhar, a coleção fica "desconhecida",
  // nunca "faltando".
  let mountCount: number | null = null;
  try {
    const mounts = normalizeAccountMounts(await fetchAccountProfile(region, token, apiLocale, '/collections/mounts'));
    if (mounts === null) throw new Error('formato inesperado');
    await admin
      .from('collection_states')
      .delete()
      .eq('user_id', userId)
      .eq('kind', 'mount')
      .eq('source', 'blizzard_api');
    if (mounts.length > 0) {
      const { error } = await admin.from('collection_states').insert(
        mounts.slice(0, 5000).map((id) => ({
          user_id: userId,
          kind: 'mount',
          external_item_id: id,
          status: 'collected',
          source: 'blizzard_api',
          observed_at: now,
          fetched_at: now,
        })),
      );
      if (error) throw error;
    }
    mountCount = mounts.length;
  } catch {
    mountCount = null;
  }

  await admin
    .from('game_connections')
    .update({
      status: 'connected',
      last_sync_error: mountCount === null ? 'mounts' : null,
      characters_synced_at: now,
      mounts_synced_at: mountCount === null ? null : now,
    })
    .eq('id', connection.id);

  return { ok: true, characters: characters.length, mounts: mountCount };
}
