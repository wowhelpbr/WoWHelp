import 'server-only';
import type { BattlenetRegion } from '@wowhelp/shared';

// Cliente da API da Blizzard. Só roda no servidor: o segredo do cliente nunca
// chega ao navegador. Endereços oficiais em docs/fase-0 (seções A1 e A2).

const OAUTH_BASE = 'https://oauth.battle.net';
const apiBase = (region: BattlenetRegion) => `https://${region}.api.blizzard.com`;

/**
 * Em teste automatizado o OAuth e a API apontam para um servidor falso local.
 * Só endereços locais são aceitos, para um engano de configuração nunca mandar
 * o segredo para fora.
 */
function testOverride(): string | null {
  const url = process.env.BATTLENET_TEST_BASE_URL;
  if (!url) return null;
  return /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url) ? url : null;
}

const clientId = () => process.env.BATTLENET_CLIENT_ID ?? '';
const clientSecret = () => process.env.BATTLENET_CLIENT_SECRET ?? '';

export function isBattlenetConfigured(): boolean {
  return clientId().length > 0 && clientSecret().length > 0;
}

export function callbackUrl(siteUrl: string): string {
  return `${siteUrl}/api/connections/battlenet/callback`;
}

export function authorizeUrl({ state, redirectUri }: { state: string; redirectUri: string }): string {
  const url = new URL(`${testOverride() ?? OAUTH_BASE}/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId());
  url.searchParams.set('scope', 'openid wow.profile');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', redirectUri);
  return url.toString();
}

export class BlizzardError extends Error {
  constructor(
    readonly code:
      'not_configured' | 'unauthorized' | 'forbidden' | 'not_found' | 'rate_limited' | 'unavailable' | 'bad_response',
    readonly status?: number,
  ) {
    super(code);
  }
}

function basicAuth(): string {
  return `Basic ${Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64')}`;
}

async function tokenRequest(
  body: URLSearchParams,
): Promise<{ access_token: string; expires_in: number; scope?: string }> {
  if (!isBattlenetConfigured()) throw new BlizzardError('not_configured');
  const res = await fetch(`${testOverride() ?? OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok)
    throw new BlizzardError(res.status === 401 || res.status === 400 ? 'unauthorized' : 'unavailable', res.status);
  const json = (await res.json()) as { access_token?: unknown; expires_in?: unknown; scope?: unknown };
  if (typeof json.access_token !== 'string') throw new BlizzardError('bad_response');
  return {
    access_token: json.access_token,
    expires_in: typeof json.expires_in === 'number' ? json.expires_in : 0,
    scope: typeof json.scope === 'string' ? json.scope : undefined,
  };
}

/** Troca o código da autorização do jogador por um token (dura 24 h, sem refresh). */
export async function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest(new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }));
}

let appToken: { value: string; expiresAt: number } | null = null;

/** Token do próprio app (Client Credentials) para a Game Data API, em memória. */
export async function getAppToken(): Promise<string> {
  if (appToken && appToken.expiresAt > Date.now() + 60_000) return appToken.value;
  const t = await tokenRequest(new URLSearchParams({ grant_type: 'client_credentials' }));
  appToken = { value: t.access_token, expiresAt: Date.now() + t.expires_in * 1000 };
  return t.access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET autenticado com nova tentativa para 429 e 5xx (espera exponencial com
 * variação aleatória, no máximo 3 tentativas) para não gerar rajada de repetição.
 */
async function getJson(url: string, token: string, namespace?: string): Promise<unknown> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, ...(namespace ? { 'Battlenet-Namespace': namespace } : {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return res.json();
    lastStatus = res.status;
    if (res.status === 401) throw new BlizzardError('unauthorized', 401);
    if (res.status === 403) throw new BlizzardError('forbidden', 403);
    if (res.status === 404) throw new BlizzardError('not_found', 404);
    if (res.status !== 429 && res.status < 500) throw new BlizzardError('bad_response', res.status);
    await sleep(2 ** attempt * 400 + Math.random() * 300);
  }
  throw new BlizzardError(lastStatus === 429 ? 'rate_limited' : 'unavailable', lastStatus);
}

export async function fetchUserInfo(token: string): Promise<unknown> {
  return getJson(`${testOverride() ?? OAUTH_BASE}/userinfo`, token);
}

/** Profile API da conta (exige o token do jogador com wow.profile). */
export async function fetchAccountProfile(region: BattlenetRegion, token: string, locale: string, path = '') {
  const base = testOverride() ?? apiBase(region);
  return getJson(`${base}/profile/user/wow${path}?locale=${locale}`, token, `profile-${region}`);
}

/** Game Data API (dados estáticos públicos, token do app). */
export async function fetchGameData(region: BattlenetRegion, path: string, locale?: string) {
  const base = testOverride() ?? apiBase(region);
  const token = await getAppToken();
  const qs = locale ? `?locale=${locale}` : '';
  return getJson(`${base}/data/wow${path}${qs}`, token, `static-${region}`);
}

/** No teste local, libera imagens servidas pela Battle.net falsa. */
export function isTestMediaUrl(url: string): boolean {
  const base = testOverride();
  return base !== null && url.startsWith(`${base}/`);
}

const IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Baixa uma imagem de render (URL já validada), com tempo e tamanho limitados. */
export async function fetchRenderImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) throw new BlizzardError('not_found', 404);
  if (!res.ok) throw new BlizzardError('unavailable', res.status);
  const type = (res.headers.get('content-type') ?? '').split(';')[0]!.trim();
  if (!IMAGE_TYPES.test(type)) throw new BlizzardError('bad_response', res.status);
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_IMAGE_BYTES) throw new BlizzardError('bad_response', res.status);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new BlizzardError('bad_response', res.status);
  return bytes;
}

/**
 * Profile API de um personagem (Client Credentials, token do app). O nome vai
 * em minúsculas, como a API exige. 404 = personagem privado ou inexistente.
 */
export async function fetchCharacterProfile(region: BattlenetRegion, realmSlug: string, name: string, path: string) {
  const base = testOverride() ?? apiBase(region);
  const token = await getAppToken();
  const url = `${base}/profile/wow/character/${encodeURIComponent(realmSlug)}/${encodeURIComponent(name.toLowerCase())}${path}?locale=en_US`;
  return getJson(url, token, `profile-${region}`);
}
