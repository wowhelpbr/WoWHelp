import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();
// Áreas da conta (as páginas também mandam noindex).
const PRIVATE_PATHS = ['/dashboard', '/characters', '/planner', '/import', '/settings'];

export default function robots(): MetadataRoute.Robots {
  // Previews da Vercel nunca devem ser indexados.
  const isProduction = process.env.VERCEL_ENV === 'production';
  return {
    rules: isProduction
      ? {
          userAgent: '*',
          allow: '/',
          disallow: ['/en', '/pt-br'].flatMap((prefix) => PRIVATE_PATHS.map((path) => `${prefix}${path}`)),
        }
      : { userAgent: '*', disallow: '/' },
    sitemap: isProduction ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
