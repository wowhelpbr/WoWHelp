// "Ao vivo agora" da Comunidade BR: leitura das respostas oficiais da Twitch
// (Helix) e do YouTube (Data API v3 e feed público do canal). Só aceita
// endereços de imagem dos domínios das próprias plataformas.

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: Json, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

const IMAGE_HOSTS = ['static-cdn.jtvnw.net', 'yt3.ggpht.com', 'yt3.googleusercontent.com', 'i.ytimg.com'];

/** URL https de imagem num domínio da Twitch ou do YouTube; `allow` libera um host extra em teste local. */
export function safeImageUrl(v: Json, allow?: (url: string) => boolean): string | null {
  const s = str(v, 500);
  if (!s) return null;
  if (allow?.(s)) return s;
  try {
    const url = new URL(s);
    return url.protocol === 'https:' && !url.username && IMAGE_HOSTS.includes(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

const isoOrNull = (v: Json): string | null => {
  const s = str(v, 40);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

export interface TwitchUser {
  id: string;
  login: string;
  avatarUrl: string | null;
}

/** GET /helix/users → usuários (id, login, foto). */
export function normalizeTwitchUsers(json: Json, allow?: (url: string) => boolean): TwitchUser[] {
  if (!isObj(json) || !Array.isArray(json.data)) return [];
  return json.data.filter(isObj).flatMap((u) => {
    const id = str(u.id, 32);
    const login = str(u.login, 25)?.toLowerCase();
    if (!id || !/^\d+$/.test(id) || !login || !/^[a-z0-9_]{3,25}$/.test(login)) return [];
    return [{ id, login, avatarUrl: safeImageUrl(u.profile_image_url, allow) }];
  });
}

export interface LiveInfo {
  title: string | null;
  game: string | null;
  viewers: number | null;
  startedAt: string | null;
  url: string;
  thumbnailUrl: string | null;
}

/** GET /helix/streams → login → live (só type "live"). Miniatura em 640x360. */
export function normalizeTwitchStreams(json: Json, allow?: (url: string) => boolean): Map<string, LiveInfo> {
  const out = new Map<string, LiveInfo>();
  if (!isObj(json) || !Array.isArray(json.data)) return out;
  for (const s of json.data.filter(isObj)) {
    const login = str(s.user_login, 25)?.toLowerCase();
    if (!login || !/^[a-z0-9_]{3,25}$/.test(login) || s.type !== 'live') continue;
    const thumb = str(s.thumbnail_url, 500)?.replace('{width}', '640').replace('{height}', '360');
    out.set(login, {
      title: str(s.title, 200),
      game: str(s.game_name, 100),
      viewers: typeof s.viewer_count === 'number' && s.viewer_count >= 0 ? Math.floor(s.viewer_count) : null,
      startedAt: isoOrNull(s.started_at),
      url: `https://www.twitch.tv/${login}`,
      thumbnailUrl: safeImageUrl(thumb, allow),
    });
  }
  return out;
}

export interface YouTubeChannel {
  id: string;
  avatarUrl: string | null;
}

/** GET /youtube/v3/channels?forHandle=... → id do canal e foto. */
export function normalizeYouTubeChannel(json: Json, allow?: (url: string) => boolean): YouTubeChannel | null {
  if (!isObj(json) || !Array.isArray(json.items)) return null;
  const item = json.items.find(isObj);
  if (!item) return null;
  const id = str(item.id, 32);
  if (!id || !/^UC[A-Za-z0-9_-]{22}$/.test(id)) return null;
  const thumbs = isObj(item.snippet) && isObj(item.snippet.thumbnails) ? item.snippet.thumbnails : null;
  const pick = thumbs && (isObj(thumbs.medium) ? thumbs.medium : isObj(thumbs.default) ? thumbs.default : null);
  return { id, avatarUrl: pick ? safeImageUrl(pick.url, allow) : null };
}

export interface FeedVideo {
  id: string;
  title: string;
  publishedAt: string | null;
  url: string;
  thumbnailUrl: string;
}

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/**
 * Feed público do canal (youtube.com/feeds/videos.xml?channel_id=...): vídeos
 * mais recentes primeiro. Leitura por padrões simples, sem interpretar o XML todo.
 */
export function parseYouTubeFeed(xml: string): FeedVideo[] {
  if (typeof xml !== 'string' || xml.length > 2_000_000) return [];
  const entries = xml.split('<entry>').slice(1, 16);
  return entries.flatMap((entry) => {
    const id = entry.match(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    if (!id || !title) return [];
    const published = entry.match(/<published>([^<]{10,40})<\/published>/)?.[1];
    return [
      {
        id,
        title: decode(title).trim().slice(0, 200),
        publishedAt: published ? isoOrNull(published) : null,
        url: `https://www.youtube.com/watch?v=${id}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      },
    ];
  });
}

/** GET /youtube/v3/videos?part=snippet,liveStreamingDetails → vídeos ao vivo agora (id → live). */
export function normalizeYouTubeLive(json: Json, allow?: (url: string) => boolean): Map<string, LiveInfo> {
  const out = new Map<string, LiveInfo>();
  if (!isObj(json) || !Array.isArray(json.items)) return out;
  for (const v of json.items.filter(isObj)) {
    const id = str(v.id, 11);
    const snippet = isObj(v.snippet) ? v.snippet : null;
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id) || !snippet || snippet.liveBroadcastContent !== 'live') continue;
    const details = isObj(v.liveStreamingDetails) ? v.liveStreamingDetails : null;
    const viewers = details ? Number(details.concurrentViewers) : NaN;
    const thumbs = isObj(snippet.thumbnails) ? snippet.thumbnails : null;
    const thumb = thumbs && (isObj(thumbs.high) ? thumbs.high : isObj(thumbs.medium) ? thumbs.medium : null);
    out.set(id, {
      title: str(snippet.title, 200),
      game: null,
      viewers: Number.isFinite(viewers) && viewers >= 0 ? Math.floor(viewers) : null,
      startedAt: details ? isoOrNull(details.actualStartTime) : null,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnailUrl: thumb ? safeImageUrl(thumb.url, allow) : null,
    });
  }
  return out;
}
