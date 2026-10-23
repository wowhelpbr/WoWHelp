import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from './env';

type CookieToSet = { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] };

export interface SessionRefresh {
  /** id do usuário autenticado, ou null. */
  userId: string | null;
  /** Aplica cookies renovados e cabeçalhos anti-cache na resposta final. */
  applyTo<T extends NextResponse>(response: T): T;
}

/**
 * Renova a sessão do Supabase no início da requisição.
 * Os cookies novos são gravados também em `request.cookies`, para que a
 * resposta criada depois (next-intl copia os cabeçalhos da requisição) leve o
 * token renovado aos Server Components sem uma segunda renovação.
 */
export async function refreshSession(request: NextRequest): Promise<SessionRefresh> {
  if (!isSupabaseConfigured()) {
    return { userId: null, applyTo: (response) => response };
  }

  let pendingCookies: CookieToSet[] = [];
  let pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        pendingCookies = cookiesToSet;
        pendingHeaders = headers ?? {};
      },
    },
  });

  let userId: string | null = null;
  try {
    // getClaims valida a assinatura do JWT; nunca usar getSession no servidor.
    const { data } = await supabase.auth.getClaims();
    userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;
  } catch {
    userId = null;
  }

  return {
    userId,
    applyTo(response) {
      pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      Object.entries(pendingHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    },
  };
}
