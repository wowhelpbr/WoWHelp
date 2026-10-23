import 'server-only';
import type { BattlenetRegion } from '@wowhelp/shared';
import { createClient } from '@/lib/supabase/server';

export interface ConnectionView {
  id: string;
  region: BattlenetRegion;
  battletag: string | null;
  status: 'connected' | 'sync_failed';
  lastSyncError: string | null;
  charactersSyncedAt: string | null;
  mountsSyncedAt: string | null;
}

export interface CharacterView {
  id: string;
  source: 'blizzard_api' | 'addon_import';
  region: BattlenetRegion;
  name: string;
  realmName: string | null;
  realmSlug: string;
  level: number | null;
  className: string | null;
  raceName: string | null;
  faction: 'ALLIANCE' | 'HORDE' | 'NEUTRAL' | null;
  fetchedAt: string;
}

/** Conexões e personagens do usuário logado (RLS limita às próprias linhas). */
export async function getMyBattlenetData(): Promise<{
  connections: ConnectionView[];
  characters: CharacterView[];
  collectedMounts: number;
} | null> {
  const supabase = await createClient();
  const [conns, chars, mounts] = await Promise.all([
    supabase
      .from('game_connections')
      .select('id, region, battletag, status, last_sync_error, characters_synced_at, mounts_synced_at')
      .order('region'),
    supabase
      .from('characters')
      .select('id, source, region, name, realm_name, realm_slug, level, class_name, race_name, faction, fetched_at')
      .order('level', { ascending: false, nullsFirst: false })
      .order('name'),
    supabase
      .from('collection_states')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'mount')
      .eq('status', 'collected'),
  ]);
  if (conns.error || chars.error) return null;

  return {
    connections: (conns.data ?? []).map((c) => ({
      id: c.id,
      region: c.region as BattlenetRegion,
      battletag: c.battletag,
      status: c.status as ConnectionView['status'],
      lastSyncError: c.last_sync_error,
      charactersSyncedAt: c.characters_synced_at,
      mountsSyncedAt: c.mounts_synced_at,
    })),
    characters: (chars.data ?? []).map((c) => ({
      id: c.id,
      source: c.source as CharacterView['source'],
      region: c.region as BattlenetRegion,
      name: c.name,
      realmName: c.realm_name,
      realmSlug: c.realm_slug,
      level: c.level,
      className: c.class_name,
      raceName: c.race_name,
      faction: c.faction as CharacterView['faction'],
      fetchedAt: c.fetched_at,
    })),
    collectedMounts: mounts.count ?? 0,
  };
}
