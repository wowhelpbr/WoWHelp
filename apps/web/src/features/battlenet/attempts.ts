import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface EncounterAttempts {
  connected: boolean;
  total: number;
  characters: { name: string; realm: string | null; count: number }[];
  fetchedAt: string | null;
}

type Row = {
  completed_count: number;
  fetched_at: string;
  characters: { name: string; realm_name: string | null } | null;
};

/**
 * Quantas vezes os personagens do jogador logado mataram o chefe (RLS: só os
 * próprios). `difficulty` nulo soma todas as dificuldades.
 */
export async function getMyEncounterAttempts(
  encounterId: number,
  difficulty: string | null,
): Promise<EncounterAttempts | null> {
  const supabase = await createClient();
  const [conns, kills] = await Promise.all([
    supabase.from('game_connections').select('id', { count: 'exact', head: true }),
    (() => {
      let q = supabase
        .from('encounter_kills')
        .select('completed_count, fetched_at, characters(name, realm_name)')
        .eq('journal_encounter_id', encounterId);
      if (difficulty) q = q.eq('difficulty', difficulty);
      return q.limit(500).returns<Row[]>();
    })(),
  ]);
  if (conns.error || kills.error) return null;

  const byCharacter = new Map<string, { name: string; realm: string | null; count: number }>();
  let fetchedAt: string | null = null;
  for (const r of kills.data ?? []) {
    const name = r.characters?.name ?? '?';
    const realm = r.characters?.realm_name ?? null;
    const key = `${name}|${realm}`;
    const prev = byCharacter.get(key);
    byCharacter.set(key, { name, realm, count: (prev?.count ?? 0) + r.completed_count });
    if (!fetchedAt || r.fetched_at > fetchedAt) fetchedAt = r.fetched_at;
  }
  const characters = [...byCharacter.values()].sort((a, b) => b.count - a.count);
  return {
    connected: (conns.count ?? 0) > 0,
    total: characters.reduce((sum, c) => sum + c.count, 0),
    characters,
    fetchedAt,
  };
}
