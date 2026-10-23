'use server';

import { randomBytes } from 'node:crypto';
import { BATTLENET_REGIONS, localeSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { authorizeUrl, callbackUrl, isBattlenetConfigured } from '@/lib/blizzard/client';
import { getSiteUrl } from '@/lib/site-url';
import { createClient } from '@/lib/supabase/server';
import { OAUTH_COOKIE, OAUTH_COOKIE_MAX_AGE, OAUTH_COOKIE_PATH, encodeOAuthState } from './oauth-state';

/** Começa (ou refaz) a conexão: guarda o state e manda o jogador para a Blizzard. */
export async function startBattlenetConnectionAction(formData: FormData): Promise<void> {
  const locale = localeSchema.safeParse(formData.get('locale'));
  const appLocale = locale.success ? locale.data : routing.defaultLocale;
  const prefix = LOCALE_PREFIX[appLocale];

  const user = await getCurrentUser();
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(`${prefix}/characters`)}`);

  const region = z.enum(BATTLENET_REGIONS).safeParse(formData.get('region'));
  if (!region.success) redirect(`${prefix}/characters?bnet=invalid_region`);
  if (!isBattlenetConfigured()) redirect(`${prefix}/characters?bnet=not_configured`);

  const state = randomBytes(32).toString('base64url');
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_COOKIE, encodeOAuthState({ state, region: region.data, locale: appLocale, userId: user.id }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !process.env.BATTLENET_TEST_BASE_URL,
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });

  redirect(authorizeUrl({ state, redirectUri: callbackUrl(getSiteUrl()) }));
}

/**
 * Desconecta e apaga tudo que veio da Battle.net (Termos da API: apagar ao
 * desvincular). Objetivos e marcações manuais do jogador continuam.
 */
export async function disconnectBattlenetAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const region = z.enum(BATTLENET_REGIONS).safeParse(formData.get('region'));
  if (!region.success) return;

  const supabase = await createClient();
  await supabase.from('characters').delete().eq('source', 'blizzard_api').eq('region', region.data);
  await supabase.from('game_connections').delete().eq('region', region.data);

  // A coleção da conta não tem região; só some quando não sobra nenhuma conexão.
  const { count } = await supabase.from('game_connections').select('id', { count: 'exact', head: true });
  if (!count) {
    await supabase.from('collection_states').delete().eq('source', 'blizzard_api');
  }
  refresh();
}
