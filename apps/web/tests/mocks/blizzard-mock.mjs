// Servidor falso da Battle.net para os testes E2E (porta 4010).
// Imita só o necessário do OAuth e da API, com dados de TESTE (não são do jogo).
import http from 'node:http';
import { stripeRoute } from './stripe-mock.mjs';

const PORT = Number(process.env.BLIZZARD_MOCK_PORT ?? 4010);
const CLIENT = Buffer.from('test-client:test-secret').toString('base64');
const TOKEN = 'mock-user-token';
const APP_TOKEN = 'mock-app-token';
// PNG 1x1 de teste (não é arte do jogo).
const TEST_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });

const characters = {
  wow_accounts: [
    {
      id: 1,
      characters: [
        {
          name: 'Testmage',
          id: 9001,
          realm: { name: 'Test Realm', id: 1, slug: 'test-realm' },
          playable_class: { name: 'Mage', id: 8 },
          playable_race: { name: 'Dwarf', id: 3 },
          faction: { type: 'ALLIANCE', name: 'Alliance' },
          level: 80,
        },
        {
          name: 'Testwarrior',
          id: 9002,
          realm: { name: 'Test Realm', id: 1, slug: 'test-realm' },
          playable_class: { name: 'Warrior', id: 1 },
          playable_race: { name: 'Orc', id: 2 },
          faction: { type: 'HORDE', name: 'Horde' },
          level: 42,
        },
      ],
    },
  ],
};

const mountDetails = {
  6: {
    id: 6,
    name: { en_US: 'Test Mount One', pt_BR: 'Montaria de Teste Um' },
    description: { en_US: 'A mount used only in tests.', pt_BR: 'Uma montaria usada só em testes.' },
    source: { type: 'VENDOR', name: { en_US: 'Vendor', pt_BR: 'Vendedor' } },
    creature_displays: [{ id: 1 }],
  },
  7: {
    id: 7,
    name: { en_US: 'Test Mount Two', pt_BR: 'Montaria de Teste Dois' },
    description: { en_US: 'Another test mount.', pt_BR: 'Outra montaria de teste.' },
    source: { type: 'DROP', name: { en_US: 'Drop', pt_BR: 'Saque' } },
    faction: { type: 'HORDE' },
  },
};

const petDetails = {
  39: {
    id: 39,
    name: { en_US: 'Test Pet One', pt_BR: 'Mascote de Teste Um' },
    description: { en_US: 'A pet used only in tests.', pt_BR: 'Um mascote usado só em testes.' },
    battle_pet_type: { id: 7, type: 'BEAST', name: { en_US: 'Beast', pt_BR: 'Fera' } },
    source: { type: 'VENDOR', name: { en_US: 'Vendor', pt_BR: 'Vendedor' } },
    creature: { id: 2671 },
  },
  40: {
    id: 40,
    name: { en_US: 'Test Pet Two', pt_BR: 'Mascote de Teste Dois' },
    battle_pet_type: { id: 5, type: 'CRITTER', name: { en_US: 'Critter', pt_BR: 'Bicho' } },
    source: { type: 'WILDPET', name: { en_US: 'Pet Battle', pt_BR: 'Batalha de Mascotes' } },
    is_alliance_only: true,
  },
};

const toyDetails = {
  1131: {
    id: 1131,
    item: { id: 54452, name: { en_US: 'Test Toy One', pt_BR: 'Brinquedo de Teste Um' } },
    source: { type: 'DROP', name: { en_US: 'Drop', pt_BR: 'Saque' } },
    media: { id: 54452 },
  },
  1132: {
    id: 1132,
    item: { id: 54453, name: { en_US: 'Test Toy Two', pt_BR: 'Brinquedo de Teste Dois' } },
    source: { type: 'VENDOR', name: { en_US: 'Vendor', pt_BR: 'Vendedor' } },
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  // Stripe falso (tests/mocks/stripe-mock.mjs).
  if (await stripeRoute(req, res, url, PORT)) return;
  const auth = req.headers.authorization ?? '';

  if (url.pathname === '/authorize') {
    const redirect = new URL(url.searchParams.get('redirect_uri'));
    if (url.searchParams.get('client_id') !== 'test-client') return json(res, 400, { error: 'invalid_client' });
    redirect.searchParams.set('code', 'mock-code');
    redirect.searchParams.set('state', url.searchParams.get('state') ?? '');
    res.writeHead(302, { Location: redirect.toString() });
    return res.end();
  }

  if (url.pathname === '/token' && req.method === 'POST') {
    if (auth !== `Basic ${CLIENT}`) return json(res, 401, { error: 'unauthorized' });
    const body = new URLSearchParams(await readBody(req));
    if (body.get('grant_type') === 'client_credentials') {
      return json(res, 200, { access_token: APP_TOKEN, token_type: 'bearer', expires_in: 86399 });
    }
    if (body.get('grant_type') === 'authorization_code' && body.get('code') === 'mock-code') {
      return json(res, 200, {
        access_token: TOKEN,
        token_type: 'bearer',
        expires_in: 86399,
        scope: 'openid wow.profile',
      });
    }
    return json(res, 400, { error: 'invalid_grant' });
  }

  const userOk = auth === `Bearer ${TOKEN}`;
  const appOk = auth === `Bearer ${APP_TOKEN}`;

  if (url.pathname === '/userinfo')
    return userOk ? json(res, 200, { id: 424242, battletag: 'Tester#1234' }) : json(res, 401, {});
  if (url.pathname === '/profile/user/wow') return userOk ? json(res, 200, characters) : json(res, 401, {});
  if (url.pathname === '/profile/user/wow/collections/mounts') {
    return userOk ? json(res, 200, { mounts: [{ mount: { id: 6, name: 'Test Mount One' } }] }) : json(res, 401, {});
  }

  if (url.pathname === '/data/wow/mount/index') {
    return appOk ? json(res, 200, { mounts: [{ id: 6 }, { id: 7 }] }) : json(res, 401, {});
  }
  const mountMatch = url.pathname.match(/^\/data\/wow\/mount\/(\d+)$/);
  if (mountMatch) {
    const detail = mountDetails[mountMatch[1]];
    if (!appOk) return json(res, 401, {});
    return detail ? json(res, 200, detail) : json(res, 404, {});
  }

  // Twitch e YouTube falsos para a Comunidade BR (dados de TESTE).
  if (url.pathname === '/oauth2/token' && req.method === 'POST') {
    const body = new URLSearchParams(await readBody(req));
    return body.get('client_id') === 'test-twitch' && body.get('client_secret') === 'test-twitch-secret'
      ? json(res, 200, { access_token: 'mock-twitch-token', expires_in: 3600, token_type: 'bearer' })
      : json(res, 403, {});
  }
  if (url.pathname === '/oauth/token' && req.method === 'POST') {
    const body = new URLSearchParams(await readBody(req));
    return body.get('client_id') === 'test-kick' && body.get('client_secret') === 'test-kick-secret'
      ? json(res, 200, { access_token: 'mock-kick-token', expires_in: 3600, token_type: 'Bearer' })
      : json(res, 401, {});
  }
  if (url.pathname === '/kick/public/v1/channels') {
    if (auth !== 'Bearer mock-kick-token') return json(res, 401, {});
    const slugs = url.searchParams.getAll('slug');
    return json(res, 200, {
      data: slugs.map((slug) =>
        slug === 'canalkickteste'
          ? {
              slug,
              stream_title: 'Live de teste na Kick',
              category: { id: 1, name: 'World of Warcraft' },
              stream: {
                is_live: true,
                viewer_count: 9,
                start_time: '2026-10-23T22:00:00Z',
                thumbnail: 'https://images.kick.com/video_thumbnails/teste/720.webp',
              },
            }
          : { slug, stream: { is_live: false } },
      ),
      message: 'OK',
    });
  }
  if (url.pathname.startsWith('/twitch/helix/')) {
    if (auth !== 'Bearer mock-twitch-token' || req.headers['client-id'] !== 'test-twitch') return json(res, 401, {});
    if (url.pathname === '/twitch/helix/users') {
      const logins = url.searchParams.getAll('login');
      return json(res, 200, {
        data: logins.map((login, i) => ({
          id: String(1000 + i),
          login,
          profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/${login}-test.png`,
        })),
      });
    }
    if (url.pathname === '/twitch/helix/streams') {
      const logins = url.searchParams.getAll('user_login');
      return json(res, 200, {
        data: logins
          .filter((l) => l === 'streamerteste')
          .map((login) => ({
            user_login: login,
            type: 'live',
            title: 'Raide de teste ao vivo',
            game_name: 'World of Warcraft',
            viewer_count: 42,
            started_at: '2026-10-23T20:00:00Z',
            thumbnail_url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-{width}x{height}.jpg`,
          })),
      });
    }
  }
  if (url.pathname === '/youtube/v3/channels') {
    if (url.searchParams.get('key') !== 'test-youtube') return json(res, 403, {});
    return url.searchParams.get('forHandle')?.toLowerCase() === '@canalteste'
      ? json(res, 200, {
          items: [
            {
              id: 'UCtesteaaaaaaaaaaaaaaaaa',
              snippet: { thumbnails: { default: { url: 'https://yt3.ggpht.com/teste=s88' } } },
            },
          ],
        })
      : json(res, 200, { items: [] });
  }
  if (url.pathname === '/feeds/videos.xml') {
    if (url.searchParams.get('channel_id') !== 'UCtesteaaaaaaaaaaaaaaaaa') return json(res, 404, {});
    res.writeHead(200, { 'Content-Type': 'application/atom+xml' });
    return res.end(`<?xml version="1.0"?><feed>
<entry><yt:videoId>LIVEVIDEO01</yt:videoId><title>Live de teste no YouTube</title><published>2026-10-23T19:00:00+00:00</published></entry>
<entry><yt:videoId>VIDEOTEST01</yt:videoId><title>Guia de teste &amp; dicas</title><published>2026-10-22T12:00:00+00:00</published></entry>
</feed>`);
  }
  if (url.pathname === '/youtube/v3/videos') {
    if (url.searchParams.get('key') !== 'test-youtube') return json(res, 403, {});
    const ids = (url.searchParams.get('id') ?? '').split(',');
    return json(res, 200, {
      items: ids.map((id) => ({
        id,
        snippet: {
          title: id === 'LIVEVIDEO01' ? 'Live de teste no YouTube' : 'Vídeo',
          liveBroadcastContent: id === 'LIVEVIDEO01' ? 'live' : 'none',
          thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } },
        },
        liveStreamingDetails:
          id === 'LIVEVIDEO01' ? { concurrentViewers: '17', actualStartTime: '2026-10-23T19:00:00Z' } : undefined,
      })),
    });
  }

  // Mascotes e brinquedos (dados de TESTE).
  if (url.pathname === '/data/wow/pet/index') {
    return appOk ? json(res, 200, { pets: [{ id: 39 }, { id: 40 }] }) : json(res, 401, {});
  }
  const petMatch = url.pathname.match(/^\/data\/wow\/pet\/(\d+)$/);
  if (petMatch) {
    if (!appOk) return json(res, 401, {});
    const pet = petDetails[petMatch[1]];
    return pet ? json(res, 200, pet) : json(res, 404, {});
  }
  const creatureMatch = url.pathname.match(/^\/data\/wow\/creature\/(\d+)$/);
  if (creatureMatch) {
    if (!appOk) return json(res, 401, {});
    return creatureMatch[1] === '2671'
      ? json(res, 200, { id: 2671, creature_displays: [{ id: 1 }] })
      : json(res, 404, {});
  }
  if (url.pathname === '/data/wow/toy/index') {
    return appOk ? json(res, 200, { toys: [{ id: 1131 }, { id: 1132 }] }) : json(res, 401, {});
  }
  const toyMatch = url.pathname.match(/^\/data\/wow\/toy\/(\d+)$/);
  if (toyMatch) {
    if (!appOk) return json(res, 401, {});
    const toy = toyDetails[toyMatch[1]];
    return toy ? json(res, 200, toy) : json(res, 404, {});
  }
  if (url.pathname === '/data/wow/item/54452') {
    if (!appOk) return json(res, 401, {});
    return json(res, 200, {
      id: 54452,
      preview_item: {
        spells: [
          {
            spell: { id: 1 },
            description: { en_US: 'Use: Summons a test balloon.', pt_BR: 'Uso: Invoca um balão de teste.' },
          },
        ],
      },
    });
  }
  const itemMediaMatch = url.pathname.match(/^\/data\/wow\/media\/item\/(\d+)$/);
  if (itemMediaMatch) {
    if (!appOk) return json(res, 401, {});
    if (itemMediaMatch[1] !== '54452') return json(res, 404, {});
    return json(res, 200, {
      id: 54452,
      assets: [{ key: 'icon', value: `http://127.0.0.1:${PORT}/render/icon-54452.png` }],
    });
  }
  if (url.pathname === '/render/icon-54452.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(TEST_IMAGE);
  }
  if (url.pathname === '/profile/user/wow/collections/pets') {
    return userOk ? json(res, 200, { pets: [{ species: { id: 39 }, level: 25 }] }) : json(res, 401, {});
  }
  if (url.pathname === '/profile/user/wow/collections/toys') {
    return userOk ? json(res, 200, { toys: [{ toy: { id: 1132 } }] }) : json(res, 401, {});
  }

  // Chefes mortos por personagem (dados de TESTE): Testmage tem raide, Testwarrior só masmorra.
  const encMatch = url.pathname.match(/^\/profile\/wow\/character\/([a-z-]+)\/([a-z]+)\/encounters\/(raids|dungeons)$/);
  if (encMatch) {
    if (!appOk) return json(res, 401, {});
    const [, , name, kind] = encMatch;
    const mode = (count) => ({
      difficulty: { type: 'HEROIC', name: 'Heroic' },
      progress: {
        completed_count: 1,
        total_count: 1,
        encounters: [{ encounter: { id: 1234, name: 'Test Boss' }, completed_count: count }],
      },
    });
    const body = (count) => ({
      expansions: [{ expansion: { id: 1 }, instances: [{ instance: { id: 10 }, modes: [mode(count)] }] }],
    });
    if (name === 'testmage' && kind === 'raids') return json(res, 200, body(7));
    if (name === 'testwarrior' && kind === 'dungeons') return json(res, 200, body(2));
    return json(res, 404, {});
  }

  const mediaMatch = url.pathname.match(/^\/data\/wow\/media\/creature-display\/(\d+)$/);
  if (mediaMatch) {
    if (!appOk) return json(res, 401, {});
    if (mediaMatch[1] !== '1') return json(res, 404, {});
    return json(res, 200, {
      id: 1,
      assets: [{ key: 'zoom', value: `http://127.0.0.1:${PORT}/render/creature-display-1.png` }],
    });
  }
  if (url.pathname === '/render/creature-display-1.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(TEST_IMAGE);
  }

  if (url.pathname === '/health') return json(res, 200, { ok: true });
  return json(res, 404, { error: 'not_found' });
});

server.listen(PORT, '127.0.0.1', () => console.log(`blizzard mock on ${PORT}`));
