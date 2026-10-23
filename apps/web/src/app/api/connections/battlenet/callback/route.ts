import { after, NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/features/auth/session';
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, decodeOAuthState, sameState } from '@/features/battlenet/oauth-state';
import { syncEncounterKills } from '@/features/battlenet/encounters';
import { syncFromAuthorization } from '@/features/battlenet/sync';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { callbackUrl } from '@/lib/blizzard/client';
import { isAdminConfigured } from '@/lib/supabase/admin';
import { logEvent } from '@/lib/log';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Retorno da autorização da Battle.net. Confere state e sessão, sincroniza e
 * volta para a página de personagens com um código de resultado (?bnet=...).
 * Nenhum token ou dado da conta aparece na URL.
 */
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const saved = decodeOAuthState(request.cookies.get(OAUTH_COOKIE)?.value);
  const prefix = LOCALE_PREFIX[saved?.locale ?? routing.defaultLocale];
  const back = (result: string) => {
    const res = NextResponse.redirect(new URL(`${prefix}/characters?bnet=${result}`, request.url));
    res.cookies.set(OAUTH_COOKIE, '', { path: OAUTH_COOKIE_PATH, maxAge: 0 });
    return res;
  };

  const params = request.nextUrl.searchParams;
  if (!saved) return back('expired');
  if (params.get('error')) return back('denied');

  const state = params.get('state') ?? '';
  const code = params.get('code') ?? '';
  if (!sameState(state, saved.state) || code.length === 0 || code.length > 512) return back('invalid_state');

  const user = await getCurrentUser();
  if (!user || user.id !== saved.userId) return back('session');
  if (!isAdminConfigured()) return back('not_configured');

  const result = await syncFromAuthorization({
    userId: user.id,
    region: saved.region,
    locale: saved.locale,
    code,
    redirectUri: callbackUrl(getSiteUrl()),
  });
  if (!result.ok) {
    logEvent('battlenet_link_failed', { code: result.code });
    return back(result.code);
  }
  logEvent('battlenet_link_succeeded', { mounts: result.mounts !== null });
  // Chefes mortos por personagem (para as tentativas): depois da resposta.
  const userId = user.id;
  after(async () => {
    await syncEncounterKills(userId, saved.region).catch(() => undefined);
  });
  return back(result.mounts === null ? 'connected_partial' : 'connected');
}
