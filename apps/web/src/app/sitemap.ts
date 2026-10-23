import type { MetadataRoute } from 'next';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();
const PUBLIC_PATHS = ['', '/mounts'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${siteUrl}${LOCALE_PREFIX[routing.defaultLocale]}${path}`,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}${LOCALE_PREFIX[l]}${path}`])),
    },
  }));
}
