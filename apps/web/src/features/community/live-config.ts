import 'server-only';

/** Quais plataformas já têm chave para o "ao vivo agora" (Twitch e YouTube, pelas APIs oficiais). */
export function liveTracking(): { twitch: boolean; youtube: boolean; any: boolean } {
  const twitch = Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
  const youtube = Boolean(process.env.YOUTUBE_API_KEY);
  return { twitch, youtube, any: twitch || youtube };
}
