import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : '';
  } catch {
    return '';
  }
})();

// Anúncios (AdSense) só entram na CSP quando configurados (ver features/ads).
const adsEnabled = /^ca-pub-\d{16}$/.test(process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '');
const ADS = adsEnabled
  ? ' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google https://*.googleadservices.com'
  : '';

// CSP sem nonce: nonce exigiria renderização dinâmica de todas as páginas
// (incompatível com o shell estático do Cache Components). Ver docs/decisoes.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${ADS}`,
  "style-src 'self' 'unsafe-inline'",
  // Imagens do catálogo vêm do Storage do Supabase (cópia própria das imagens oficiais).
  // + fotos e miniaturas oficiais da Twitch, do YouTube e da Kick (Comunidade BR).
  `img-src 'self' data: blob: ${supabaseOrigin} https://static-cdn.jtvnw.net https://yt3.ggpht.com https://yt3.googleusercontent.com https://i.ytimg.com https://images.kick.com https://files.kick.com${adsEnabled ? ' https:' : ''}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin}${ADS}`.trim(),
  // Os anúncios do AdSense são desenhados dentro de iframes do Google.
  `frame-src 'self'${ADS}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ['@wowhelp/shared'],
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
