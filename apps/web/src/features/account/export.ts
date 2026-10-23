import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Tabelas com dados do jogador. Leitura com a sessão dele (RLS): o export
// nunca consegue incluir linha de outra conta.
const TABLES = [
  'profiles',
  'goals',
  'goal_steps',
  'recurring_tasks',
  'task_completions',
  'game_connections',
  'characters',
  'collection_states',
  'addon_imports',
] as const;

const PAGE = 1000;
const MAX_ROWS = 50_000;

export type AccountExport = {
  format: 'wowhelp-account-export';
  version: 1;
  exportedAt: string;
  account: { id: string; email: string | null; createdAt: string | null };
  data: Record<(typeof TABLES)[number], unknown[]>;
};

/** Tudo o que o WoWHelp guarda sobre a conta logada, em JSON (LGPD, art. 18). */
export async function buildAccountExport(): Promise<AccountExport | null> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return null;

  const data = {} as AccountExport['data'];
  for (const table of TABLES) {
    const rows: unknown[] = [];
    // A API do Supabase devolve no máximo 1000 linhas por consulta.
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
      const { data: page, error } = await supabase
        .from(table)
        .select('*')
        .order('id')
        .range(from, from + PAGE - 1);
      if (error) return null;
      rows.push(...(page ?? []));
      if ((page ?? []).length < PAGE) break;
    }
    data[table] = rows;
  }

  return {
    format: 'wowhelp-account-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { id: auth.user.id, email: auth.user.email ?? null, createdAt: auth.user.created_at ?? null },
    data,
  };
}
