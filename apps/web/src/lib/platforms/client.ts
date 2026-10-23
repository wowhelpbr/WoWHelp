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
