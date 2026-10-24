import 'server-only';

/** Quais plataformas já têm chave para o "ao vivo agora" (Twitch, YouTube e Kick, pelas APIs oficiais). */
export function liveTracking(): { twitch: boolean; youtube: boolean; kick: boolean; any: boolean } {
  const twitch = Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
  const youtube = Boolean(process.env.YOUTUBE_API_KEY);
  const kick = Boolean(process.env.KICK_CLIENT_ID && process.env.KICK_CLIENT_SECRET);
  return { twitch, youtube, kick, any: twitch || youtube || kick };
}
