import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100';

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
