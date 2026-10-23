import 'server-only';
import { normalizeCharacterEncounters, type BattlenetRegion, type EncounterKill } from '@wowhelp/shared';
import { fetchCharacterProfile } from '@/lib/blizzard/client';
import { createAdminClient } from '@/lib/supabase/admin';

// Chefes mortos por personagem (Profile API, encounters/raids e /dungeons).
// Roda depois da resposta da conexão (after), para o jogador não esperar.

const MIN_LEVEL = 10;
const MAX_CHARACTERS = 60;
const CONCURRENCY = 4;

type Character = { id: string; realm_slug: string; name: string };

async function killsOf(region: BattlenetRegion, c: Character): Promise<EncounterKill[] | null> {
  const results = await Promise.allSettled(
    ['/encounters/raids', '/encounters/dungeons'].map(async (path) =>
      normalizeCharacterEncounters(await fetchCharacterProfile(region, c.realm_slug, c.name, path)),
    ),
  );
  // As duas falharam (privado, inexistente ou fora do ar): não mexe no que já existe.
  if (results.every((r) => r.status === 'rejected')) return null;
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

/** Substitui as mortes de chefe dos personagens da Battle.net daquela região. */
export async function syncEncounterKills(userId: string, region: BattlenetRegion): Promise<{ characters: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('characters')
    .select('id, realm_slug, name')
    .eq('user_id', userId)
    .eq('source', 'blizzard_api')
    .eq('region', region)
    .gte('level', MIN_LEVEL)
    .order('level', { ascending: false })
    .limit(MAX_CHARACTERS);
  if (error || !data) return { characters: 0 };

  let done = 0;
  const now = new Date().toISOString();
  for (let i = 0; i < data.length; i += CONCURRENCY) {
    await Promise.all(
      (data as Character[]).slice(i, i + CONCURRENCY).map(async (c) => {
        const kills = await killsOf(region, c);
        if (kills === null) return;
        await admin.from('encounter_kills').delete().eq('character_id', c.id);
        const rows = kills
          .filter((k) => k.completedCount > 0)
          .slice(0, 3000)
          .map((k) => ({
            user_id: userId,
            character_id: c.id,
            journal_encounter_id: k.encounterId,
            difficulty: k.difficulty,
            completed_count: k.completedCount,
            last_kill_at: k.lastKillAt,
            fetched_at: now,
          }));
        if (rows.length > 0) {
          const { error: insertError } = await admin.from('encounter_kills').insert(rows);
          if (insertError) return;
        }
        done++;
      }),
    );
  }
  return { characters: done };
}
