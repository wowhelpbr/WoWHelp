import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  // Previews da Vercel nunca devem ser indexados.
  const isProduction = process.env.VERCEL_ENV === 'production';
  return {
    rules: isProduction
      ? {
          userAgent: '*',
          allow: '/',
          disallow: ['/en/dashboard', '/pt-br/dashboard', '/en/settings', '/pt-br/settings'],
        }
      : { userAgent: '*', disallow: '/' },
    sitemap: isProduction ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
