import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Urbanist } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { AdsLoader, ConsentBanner } from '@/features/ads/ads';
import { AdsGate } from '@/features/billing/ads-gate';
import { MotionProvider } from '@/features/gamification/motion';
import { SiteHeader } from '@/components/layout/site-header';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import '../globals.css';
import { getSiteUrl } from '@/lib/site-url';

// Chakra Petch: títulos, rótulos, números e botões (caixa alta). Urbanist: texto corrido.
const chakra = Chakra_Petch({
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
});
const urbanist = Urbanist({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
});

const siteUrl = getSiteUrl();

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: 'Meta',
  });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t('title'), template: t('titleTemplate') },
    description: t('description'),
    applicationName: 'WoWHelp',
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, LOCALE_PREFIX[l]])),
    },
    appleWebApp: { capable: true, title: 'WoWHelp', statusBarStyle: 'black-translucent' },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: '#0b1015',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Nav' });

  return (
    <html lang={locale} className={`${chakra.variable} ${urbanist.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <MotionProvider>
            <a
              href="#main"
              className="sr-only z-50 bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              {t('skipToContent')}
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <MobileTabBar />
            <ServiceWorkerRegister />
            <Suspense fallback={null}>
              <AdsGate />
            </Suspense>
            <ConsentBanner />
            <AdsLoader />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
