import type { EmailOtpType } from '@supabase/supabase-js';
import { hasLocale } from 'next-intl';
import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { safeNextPath } from '@/lib/safe-redirect';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

// Tipos de link aceitos nesta fase. Recuperação de senha entra depois.
const ALLOWED_TYPES: readonly EmailOtpType[] = ['email', 'signup', 'email_change'];

/**
 * Destino do link de confirmação de e-mail.
 * - token_hash + type: fluxo recomendado (funciona em outro aparelho);
 * - code: fluxo PKCE padrão do Supabase (mesmo navegador do cadastro).
 */
export async function GET(request: NextRequest, ctx: RouteContext<'/[locale]/auth/confirm'>) {
  const { locale } = await ctx.params;
  const prefix = LOCALE_PREFIX[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get('next'), `${prefix}/dashboard`);
  const errorUrl = new URL(`${prefix}/auth/error`, request.url);

  if (!isSupabaseConfigured()) return NextResponse.redirect(errorUrl);

  const supabase = await createClient();
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const code = params.get('code');

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(errorUrl);
}
