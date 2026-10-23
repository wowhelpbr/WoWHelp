import { describe, expect, it } from 'vitest';
import {
  normalizeTwitchStreams,
  normalizeTwitchUsers,
  normalizeYouTubeChannel,
  normalizeYouTubeLive,
  parseYouTubeFeed,
  safeImageUrl,
} from './live';

// Respostas no formato das documentações oficiais (dados de TESTE).
describe('Twitch (Helix)', () => {
  it('usuários: id, login em minúsculas e foto da Twitch', () => {
    expect(
      normalizeTwitchUsers({
        data: [
          {
            id: '123',
            login: 'Streamer_BR',
            profile_image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/a.png',
          },
          { id: 'x', login: 'bad' },
        ],
      }),
    ).toEqual([{ id: '123', login: 'streamer_br', avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/a.png' }]);
  });

  it('lives: só type live, miniatura em 640x360', () => {
    const live = normalizeTwitchStreams({
      data: [
        {
          user_login: 'streamer_br',
          type: 'live',
          title: 'Raide mítica hoje',
          game_name: 'World of Warcraft',
          viewer_count: 321,
          started_at: '2026-10-23T20:00:00Z',
          thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_streamer_br-{width}x{height}.jpg',
        },
        { user_login: 'outro', type: '', title: 'x' },
      ],
    });
    expect(live.get('streamer_br')).toEqual({
      title: 'Raide mítica hoje',
      game: 'World of Warcraft',
      viewers: 321,
      startedAt: '2026-10-23T20:00:00.000Z',
      url: 'https://www.twitch.tv/streamer_br',
      thumbnailUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_streamer_br-640x360.jpg',
    });
    expect(live.has('outro')).toBe(false);
  });
});

describe('YouTube', () => {
  it('canal por handle: id UC e foto', () => {
    expect(
      normalizeYouTubeChannel({
        items: [
          {
            id: 'UCabcdefghijklmnopqrstuv',
            snippet: { thumbnails: { default: { url: 'https://yt3.ggpht.com/abc=s88' } } },
          },
        ],
      }),
    ).toEqual({ id: 'UCabcdefghijklmnopqrstuv', avatarUrl: 'https://yt3.ggpht.com/abc=s88' });
    expect(normalizeYouTubeChannel({ items: [] })).toBeNull();
  });

  it('feed: vídeos com título decodificado e miniatura do próprio YouTube', () => {
    const xml = `<?xml version="1.0"?><feed>
      <entry><id>yt:video:AAAAAAAAAAA</id><yt:videoId>AAAAAAAAAAA</yt:videoId><title>Guia &amp; dicas &quot;Mítica+&quot;</title><published>2026-10-22T12:00:00+00:00</published></entry>
      <entry><yt:videoId>bad</yt:videoId><title>x</title></entry>
    </feed>`;
    expect(parseYouTubeFeed(xml)).toEqual([
      {
        id: 'AAAAAAAAAAA',
        title: 'Guia & dicas "Mítica+"',
        publishedAt: '2026-10-22T12:00:00.000Z',
        url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA',
        thumbnailUrl: 'https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg',
      },
    ]);
  });

  it('lives: só liveBroadcastContent "live"', () => {
    const live = normalizeYouTubeLive({
      items: [
        {
          id: 'BBBBBBBBBBB',
          snippet: {
            title: 'Live de WoW',
            liveBroadcastContent: 'live',
            thumbnails: { high: { url: 'https://i.ytimg.com/vi/BBBBBBBBBBB/hqdefault_live.jpg' } },
          },
          liveStreamingDetails: { concurrentViewers: '87', actualStartTime: '2026-10-23T21:00:00Z' },
        },
        { id: 'CCCCCCCCCCC', snippet: { title: 'Vídeo', liveBroadcastContent: 'none' } },
      ],
    });
    expect([...live.keys()]).toEqual(['BBBBBBBBBBB']);
    expect(live.get('BBBBBBBBBBB')).toMatchObject({ viewers: 87, url: 'https://www.youtube.com/watch?v=BBBBBBBBBBB' });
  });
});

describe('imagens', () => {
  it('só https nos domínios das plataformas', () => {
    expect(safeImageUrl('https://i.ytimg.com/vi/x/hq.jpg')).toBe('https://i.ytimg.com/vi/x/hq.jpg');
    expect(safeImageUrl('http://i.ytimg.com/vi/x/hq.jpg')).toBeNull();
    expect(safeImageUrl('https://evil.example.com/a.jpg')).toBeNull();
    expect(safeImageUrl('javascript:alert(1)')).toBeNull();
    expect(safeImageUrl('http://127.0.0.1:4010/a.png', (u) => u.startsWith('http://127.0.0.1:'))).toBe(
      'http://127.0.0.1:4010/a.png',
    );
  });
});
