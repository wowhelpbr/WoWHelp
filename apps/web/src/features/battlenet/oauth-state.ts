import { BATTLENET_REGIONS, LOCALES, type BattlenetRegion, type Locale } from '@wowhelp/shared';
import { z } from 'zod';

// Dados de ida e volta da autorização, guardados num cookie httpOnly de 10 min.
// O `state` aleatório é conferido na volta (proteção contra CSRF, como a
// Blizzard recomenda) e o usuário da sessão precisa ser o mesmo que começou.

export const OAUTH_COOKIE = 'wh_bnet_oauth';
export const OAUTH_COOKIE_PATH = '/api/connections/battlenet';
export const OAUTH_COOKIE_MAX_AGE = 600;

const schema = z.object({
  s: z.string().min(32).max(128),
  r: z.enum(BATTLENET_REGIONS),
  l: z.enum(LOCALES),
  u: z.uuid(),
});

export interface OAuthState {
  state: string;
  region: BattlenetRegion;
  locale: Locale;
  userId: string;
}

export function encodeOAuthState(v: OAuthState): string {
  return Buffer.from(JSON.stringify({ s: v.state, r: v.region, l: v.locale, u: v.userId })).toString('base64url');
}

export function decodeOAuthState(raw: string | undefined): OAuthState | null {
  if (!raw || raw.length > 1024) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')));
    if (!parsed.success) return null;
    return { state: parsed.data.s, region: parsed.data.r, locale: parsed.data.l, userId: parsed.data.u };
  } catch {
    return null;
  }
}

/** Comparação em tempo constante para o state. */
export function sameState(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
