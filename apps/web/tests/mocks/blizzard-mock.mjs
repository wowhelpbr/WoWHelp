// Servidor falso da Battle.net para os testes E2E (porta 4010).
// Imita só o necessário do OAuth e da API, com dados de TESTE (não são do jogo).
import http from 'node:http';

const PORT = Number(process.env.BLIZZARD_MOCK_PORT ?? 4010);
const CLIENT = Buffer.from('test-client:test-secret').toString('base64');
const TOKEN = 'mock-user-token';
const APP_TOKEN = 'mock-app-token';

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
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

  if (url.pathname === '/health') return json(res, 200, { ok: true });
  return json(res, 404, { error: 'not_found' });
});

server.listen(PORT, '127.0.0.1', () => console.log(`blizzard mock on ${PORT}`));
