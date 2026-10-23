// Só variáveis públicas aqui. A chave publishable é feita para o navegador
// e depende da RLS; a secret/service role nunca entra no app web nesta fase.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && supabasePublishableKey.length > 0;
}
