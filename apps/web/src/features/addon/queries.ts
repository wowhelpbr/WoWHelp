import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface ImportView {
  id: string;
  importedAt: string;
  observedAt: string | null;
  addonVersion: string;
  charactersCount: number;
  mountsCount: number | null;
  categories: string[];
}

/** Histórico de importações do usuário logado (RLS: só as próprias). */
export async function getMyAddonImports(): Promise<ImportView[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('addon_imports')
    .select('id, imported_at, observed_at, addon_version, characters_count, mounts_count, categories')
    .order('imported_at', { ascending: false })
    .limit(20);
  if (error) return null;
  return (data ?? []).map((r) => ({
    id: r.id,
    importedAt: r.imported_at,
    observedAt: r.observed_at,
    addonVersion: r.addon_version,
    charactersCount: r.characters_count,
    mountsCount: r.mounts_count,
    categories: r.categories,
  }));
}
