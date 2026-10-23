import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublishableKey, supabaseUrl } from './env';

/**
 * Cliente por requisição para Server Components, Server Actions e Route Handlers.
 * Em Server Components a escrita de cookies falha (é esperado): quem renova a
 * sessão é o proxy (src/proxy.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: ignorar, o proxy cuida da renovação.
        }
      },
    },
  });
}
