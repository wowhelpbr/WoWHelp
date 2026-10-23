/*
 * Service worker do WoWHelp. Política deliberadamente conservadora:
 * - guarda só arquivos estáticos versionados (/_next/static, /icons) e as
 *   páginas offline, baixadas SEM cookies (nunca contêm dados da conta);
 * - nunca guarda HTML de páginas, respostas de API, Supabase ou qualquer
 *   coisa ligada à sessão;
 * - navegação sem rede cai na página offline do idioma.
 */
const VERSION = 'v1';
const STATIC_CACHE = `wowhelp-static-${VERSION}`;
const OFFLINE_CACHE = `wowhelp-offline-${VERSION}`;
const OFFLINE_PAGES = { en: '/en/offline', 'pt-br': '/pt-br/offline' };

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      await Promise.all(
        Object.values(OFFLINE_PAGES).map(async (path) => {
          const response = await fetch(path, { credentials: 'omit', cache: 'no-store' });
          if (response.ok) await cache.put(path, response);
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, OFFLINE_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith('wowhelp-') && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
  );
}

function offlinePathFor(url) {
  return url.pathname.startsWith('/pt-br') ? OFFLINE_PAGES['pt-br'] : OFFLINE_PAGES.en;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match(offlinePathFor(url), { cacheName: OFFLINE_CACHE });
          return cached ?? new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') cache.put(request, response.clone());
        return response;
      })(),
    );
  }
  // Todo o resto (API, Supabase, server actions, RSC) vai direto para a rede.
});
