import 'server-only';
import {
  normalizeTwitchStreams,
  normalizeTwitchUsers,
  normalizeYouTubeChannel,
  normalizeYouTubeLive,
  parseYouTubeFeed,
  type LiveInfo,
} from '@wowhelp/shared';
import { createAdminClient } from '@/lib/supabase/admin';
import { isTestPlatformUrl, twitchGet, youtubeFeed, youtubeGet } from '@/lib/platforms/client';
import { liveTracking } from './live-config';

// Atualiza "ao vivo agora", foto e último vídeo dos canais da Comunidade BR.
// Twitch: 2 chamadas por lote de 100 canais. YouTube: feed público (grátis)
// + 1 unidade de cota por lote de 50 vídeos para saber se algum está ao vivo.

type Channel = {
  id: string;
  platform: 'twitch' | 'youtube' | 'kick';
  handle: string;
  external_id: string | null;
  avatar_url: string | null;
};

export interface LiveSyncResult {
  twitch: number;
  youtube: number;
  live: number;
  failed: number;
}

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

const notLive = {
  is_live: false,
  live_title: null,
  live_game: null,
  live_viewers: null,
  live_started_at: null,
  live_url: null,
  live_thumbnail_url: null,
};

const liveFields = (l: LiveInfo) => ({
  is_live: true,
  live_title: l.title,
  live_game: l.game,
  live_viewers: l.viewers,
  live_started_at: l.startedAt,
  live_url: l.url,
  live_thumbnail_url: l.thumbnailUrl,
});

export async function syncCommunityLive(): Promise<LiveSyncResult> {
  const tracking = liveTracking();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('creator_channels')
    .select('id, platform, handle, external_id, avatar_url, creators!inner(status)')
    .eq('creators.status', 'published')
    .limit(2000);
  if (error) throw error;
  const channels = (data ?? []) as unknown as Channel[];
  const now = new Date().toISOString();
  const result: LiveSyncResult = { twitch: 0, youtube: 0, live: 0, failed: 0 };
  const update = async (id: string, fields: Record<string, unknown>) => {
    const { error: e } = await admin
      .from('creator_channels')
      .update({ ...fields, checked_at: now })
      .eq('id', id);
    if (e) result.failed++;
  };

  // Twitch
  const twitch = channels.filter((c) => c.platform === 'twitch');
  if (tracking.twitch && twitch.length > 0) {
    for (const group of chunk(twitch, 100)) {
      try {
        const qs = group.map((c) => `login=${encodeURIComponent(c.handle)}`).join('&');
        const users = normalizeTwitchUsers(await twitchGet(`/helix/users?${qs}`), isTestPlatformUrl);
        const streams = normalizeTwitchStreams(
          await twitchGet(
            `/helix/streams?first=100&${group.map((c) => `user_login=${encodeURIComponent(c.handle)}`).join('&')}`,
          ),
          isTestPlatformUrl,
        );
        for (const c of group) {
          const user = users.find((u) => u.login === c.handle.toLowerCase());
          const live = streams.get(c.handle.toLowerCase());
          await update(c.id, {
            external_id: user?.id ?? c.external_id,
            avatar_url: user?.avatarUrl ?? c.avatar_url,
            ...(live ? liveFields(live) : notLive),
          });
          result.twitch++;
          if (live) result.live++;
        }
      } catch {
        result.failed += group.length;
      }
    }
  }

  // YouTube
  const youtube = channels.filter((c) => c.platform === 'youtube');
  if (tracking.youtube && youtube.length > 0) {
    const recent = new Map<string, string>(); // vídeo → canal
    for (const c of youtube) {
      try {
        let channelId = c.external_id;
        let avatar = c.avatar_url;
        if (!channelId || !avatar) {
          const params: Record<string, string> = channelId
            ? { part: 'snippet', id: channelId }
            : { part: 'snippet', forHandle: c.handle };
          const info = normalizeYouTubeChannel(await youtubeGet('/v3/channels', params), isTestPlatformUrl);
          channelId = info?.id ?? channelId;
          avatar = info?.avatarUrl ?? avatar;
        }
        if (!channelId) {
          await update(c.id, notLive);
          continue;
        }
        const videos = parseYouTubeFeed(await youtubeFeed(channelId));
        const newest = videos[0];
        for (const v of videos.slice(0, 3)) recent.set(v.id, c.id);
        await update(c.id, {
          external_id: channelId,
          avatar_url: avatar,
          latest_title: newest?.title ?? null,
          latest_url: newest?.url ?? null,
          latest_thumbnail_url: newest?.thumbnailUrl ?? null,
          latest_published_at: newest?.publishedAt ?? null,
          ...notLive,
        });
        result.youtube++;
      } catch {
        result.failed++;
      }
    }
    for (const ids of chunk([...recent.keys()], 50)) {
      try {
        const live = normalizeYouTubeLive(
          await youtubeGet('/v3/videos', { part: 'snippet,liveStreamingDetails', id: ids.join(',') }),
          isTestPlatformUrl,
        );
        for (const [videoId, info] of live) {
          const channelRow = recent.get(videoId);
          if (!channelRow) continue;
          await update(channelRow, liveFields(info));
          result.live++;
        }
      } catch {
        result.failed++;
      }
    }
  }

  return result;
}
