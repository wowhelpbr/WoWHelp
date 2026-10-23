import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * Camada de acesso à sessão (DAL). Lê e valida o JWT com getClaims a cada
 * requisição; deduplicado por render com React.cache. Toda Server Action e
 * Route Handler deve chamar isto de novo, nunca confiar no cliente.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // A validação do token compara a expiração com o relógio (Date.now): isso
  // não pode entrar em pré-renderização nem na pré-busca do App Shell.
  await connection();
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    if (error || typeof sub !== 'string') return null;
    const email = data?.claims?.email;
    return { id: sub, email: typeof email === 'string' ? email : null };
  } catch {
    return null;
  }
});
