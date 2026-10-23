// Comunidade BR: leitura dos canais dos criadores. Aceita o link ou só o
// nome do canal e devolve a forma canônica (link https oficial da plataforma).

export const CREATOR_TAGS = [
  'raide',
  'mitica',
  'pvp',
  'lore',
  'iniciantes',
  'casual',
  'colecionador',
  'moradia',
  'guias',
  'humor',
] as const;
export type CreatorTag = (typeof CREATOR_TAGS)[number];

export const CREATOR_PLATFORMS = ['twitch', 'youtube', 'kick'] as const;
export type CreatorPlatform = (typeof CREATOR_PLATFORMS)[number];

export interface ChannelRef {
  platform: CreatorPlatform;
  /** Twitch e Kick: login em minúsculas. YouTube: "@handle" ou id do canal (UC...). */
  handle: string;
  url: string;
  /** YouTube por id do canal: já sabemos o id oficial. */
  externalId: string | null;
}

function asUrl(input: string, hosts: string[]): URL | null {
  const raw = input.trim();
  if (!/[./]/.test(raw)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    return hosts.includes(url.hostname.toLowerCase()) ? url : null;
  } catch {
    return null;
  }
}

const firstSegment = (url: URL) => url.pathname.split('/').filter(Boolean)[0] ?? '';

/** twitch.tv/login ou só "login" (4 a 25 letras, números e _). */
export function parseTwitch(input: string): ChannelRef | null {
  const url = asUrl(input, ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv']);
  const login = (url ? firstSegment(url) : input.trim()).toLowerCase();
  if (!/^[a-z0-9_]{3,25}$/.test(login)) return null;
  return { platform: 'twitch', handle: login, url: `https://www.twitch.tv/${login}`, externalId: null };
}

/** kick.com/canal ou só "canal". */
export function parseKick(input: string): ChannelRef | null {
  const url = asUrl(input, ['kick.com', 'www.kick.com']);
  const slug = (url ? firstSegment(url) : input.trim()).toLowerCase();
  if (!/^[a-z0-9_-]{3,25}$/.test(slug)) return null;
  return { platform: 'kick', handle: slug, url: `https://kick.com/${slug}`, externalId: null };
}

/** youtube.com/@handle, youtube.com/channel/UC..., "@handle" ou "UC...". */
export function parseYouTube(input: string): ChannelRef | null {
  const url = asUrl(input, ['youtube.com', 'www.youtube.com', 'm.youtube.com']);
  const parts = url ? url.pathname.split('/').filter(Boolean) : [input.trim()];
  const [first, second] = parts;
  const channelId = first === 'channel' ? second : first;
  if (channelId && /^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
    return {
      platform: 'youtube',
      handle: channelId,
      url: `https://www.youtube.com/channel/${channelId}`,
      externalId: channelId,
    };
  }
  const handle = first?.startsWith('@') ? first.slice(1) : url ? null : first;
  if (!handle || !/^[A-Za-z0-9._-]{3,30}$/.test(handle)) return null;
  return { platform: 'youtube', handle: `@${handle}`, url: `https://www.youtube.com/@${handle}`, externalId: null };
}

export const parseChannel = (platform: CreatorPlatform, input: string): ChannelRef | null =>
  platform === 'twitch' ? parseTwitch(input) : platform === 'kick' ? parseKick(input) : parseYouTube(input);

/** Nome do criador → endereço da página (sem acento, minúsculas, hífens). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}
