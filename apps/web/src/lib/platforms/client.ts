import 'server-only';

// Clientes das APIs oficiais da Twitch (Helix, token do app por Client
// Credentials) e do YouTube (Data API v3 com chave + feed público do canal).
// Em teste local, um desvio aponta para a API falsa (só aceita localhost).

const local = (name: string) => {
  const url = process.env[name];
  return url && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url) ? url : null;
};

const TWITCH_ID = () => local('TWITCH_TEST_BASE_URL') ?? 'https://id.twitch.tv';
const TWITCH_API = () =>
  local('TWITCH_TEST_BASE_URL') ? `${local('TWITCH_TEST_BASE_URL')}/twitch` : 'https://api.twitch.tv';
const YOUTUBE_API = () =>
  local('YOUTUBE_TEST_BASE_URL') ? `${local('YOUTUBE_TEST_BASE_URL')}/youtube` : 'https://www.googleapis.com/youtube';
const YOUTUBE_FEEDS = () => local('YOUTUBE_TEST_BASE_URL') ?? 'https://www.youtube.com';

/** Em teste local, aceita imagens servidas pela API falsa. */
export function isTestPlatformUrl(url: string): boolean {
  const base = local('TWITCH_TEST_BASE_URL') ?? local('YOUTUBE_TEST_BASE_URL');
  return base !== null && url.startsWith(`${base}/`);
}

export class PlatformError extends Error {
  constructor(
    readonly code: 'unauthorized' | 'quota' | 'unavailable' | 'bad_response',
    readonly status?: number,
  ) {
    super(code);
  }
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (res.status === 401) throw new PlatformError('unauthorized', 401);
  if (res.status === 403 || res.status === 429) throw new PlatformError('quota', res.status);
  if (!res.ok) throw new PlatformError('unavailable', res.status);
  return res.json();
}

let twitchToken: { value: string; expiresAt: number } | null = null;

async function twitchAppToken(): Promise<string> {
  if (twitchToken && twitchToken.expiresAt > Date.now() + 60_000) return twitchToken.value;
  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID ?? '',
    client_secret: process.env.TWITCH_CLIENT_SECRET ?? '',
    grant_type: 'client_credentials',
  });
  const res = await fetch(`${TWITCH_ID()}/oauth2/token`, {
    method: 'POST',
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new PlatformError('unauthorized', res.status);
  const json = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof json.access_token !== 'string') throw new PlatformError('bad_response');
  twitchToken = {
    value: json.access_token,
    expiresAt: Date.now() + (typeof json.expires_in === 'number' ? json.expires_in : 3600) * 1000,
  };
  return twitchToken.value;
}

/** GET na Helix (ex.: "/helix/streams?user_login=a&user_login=b"). */
export async function twitchGet(pathAndQuery: string): Promise<unknown> {
  const token = await twitchAppToken();
  return getJson(`${TWITCH_API()}${pathAndQuery}`, {
    'Client-Id': process.env.TWITCH_CLIENT_ID ?? '',
    Authorization: `Bearer ${token}`,
  });
}

/** GET na YouTube Data API v3 (ex.: "/v3/channels", { part: "snippet", forHandle: "@x" }). */
export async function youtubeGet(path: string, params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY ?? '' });
  return getJson(`${YOUTUBE_API()}${path}?${qs}`);
}

/** Feed público com os últimos vídeos do canal (não gasta cota da API). */
export async function youtubeFeed(channelId: string): Promise<string> {
  const res = await fetch(`${YOUTUBE_FEEDS()}/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new PlatformError('unavailable', res.status);
  const text = await res.text();
  return text.slice(0, 2_000_000);
}

const KICK_ID = () => local('KICK_TEST_BASE_URL') ?? 'https://id.kick.com';
const KICK_API = () => (local('KICK_TEST_BASE_URL') ? `${local('KICK_TEST_BASE_URL')}/kick` : 'https://api.kick.com');

let kickToken: { value: string; expiresAt: number } | null = null;

/** Token do app na Kick (Client Credentials): só dados públicos, sem login do criador. */
async function kickAppToken(): Promise<string> {
  if (kickToken && kickToken.expiresAt > Date.now() + 60_000) return kickToken.value;
  const body = new URLSearchParams({
    client_id: process.env.KICK_CLIENT_ID ?? '',
    client_secret: process.env.KICK_CLIENT_SECRET ?? '',
    grant_type: 'client_credentials',
  });
  const res = await fetch(`${KICK_ID()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new PlatformError('unauthorized', res.status);
  const json = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof json.access_token !== 'string') throw new PlatformError('bad_response');
  kickToken = {
    value: json.access_token,
    expiresAt: Date.now() + (typeof json.expires_in === 'number' ? json.expires_in : 3600) * 1000,
  };
  return kickToken.value;
}

/** GET na Public API da Kick (ex.: "/public/v1/channels?slug=a&slug=b"). */
export async function kickGet(pathAndQuery: string): Promise<unknown> {
  const token = await kickAppToken();
  return getJson(`${KICK_API()}${pathAndQuery}`, { Authorization: `Bearer ${token}` });
}
