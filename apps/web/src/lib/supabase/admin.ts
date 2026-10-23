import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl } from './env';

/**
 * Cliente com a chave secreta (ignora RLS). Só para gravar dados que vieram da
 * Blizzard ou do catálogo, SEMPRE depois de validar a sessão do usuário no
 * servidor e sempre filtrando pelo user_id da sessão. Nunca importar em código
 * de cliente.
 */
export function isAdminConfigured(): boolean {
  return supabaseUrl.length > 0 && (process.env.SUPABASE_SECRET_KEY ?? '').length > 0;
}

export function createAdminClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
