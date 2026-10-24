import { Eye, Gem, Heart } from 'lucide-react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ClassArt } from '@/components/brand/class-art';
import { Container } from '@/components/ui/container';
import { SupporterPlans } from '@/features/billing/supporter-plans';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Supporter');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default function SupporterPage({ searchParams }: PageProps<'/[locale]/supporter'>) {
  const t = useTranslations('Supporter');
  // A última palavra do título ganha o neon ("WoWHelp").
  const title = t('title');
  const cut = title.lastIndexOf(' ');
  const benefits = [
    ['benefitNoAds', Eye],
    ['benefitBadge', Gem],
    ['benefitThanks', Heart],
  ] as const;

  return (
    <>
      <section className="hex-grid relative overflow-hidden border-b border-border-soft">
        <Container className="grid items-center gap-8 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:py-16">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="text-[2.75rem] leading-[0.95] text-foreground sm:text-6xl xl:text-7xl">
              {cut > 0 ? title.slice(0, cut) : title}{' '}
              {cut > 0 && (
                <span className="text-primary [text-shadow:0_0_30px_rgb(197_251_20/0.45)]">{title.slice(cut + 1)}</span>
              )}
            </h1>
            <p className="text-lg text-muted-foreground">{t('intro')}</p>
            <p className="text-sm text-faint">{t('promise')}</p>
          </div>
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div
              aria-hidden
              className="absolute inset-[8%] bg-[radial-gradient(closest-side,rgb(122_20_248/0.35),transparent_70%)] blur-md"
            />
            <ClassArt name="mage" sizes="448px" className="relative w-full drop-shadow-[0_20px_50px_rgb(0_0_0/0.6)]" />
          </div>
        </Container>
      </section>
      <Container className="flex flex-col gap-8 py-10 sm:py-12">
        <section aria-labelledby="benefits-title">
          <h2 id="benefits-title" className="sr-only">
            {t('benefitsTitle')}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {benefits.map(([key, Icon]) => (
              <li key={key} className="glass flex flex-col gap-3 p-5">
                <span className="grid size-10 place-items-center rounded-md bg-foreground text-background" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <h3 className="text-base text-foreground">{t(`${key}Title`)}</h3>
                <p className="text-sm text-faint">{t(`${key}Body`)}</p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="plans-title" className="flex flex-col gap-4">
          <h2 id="plans-title" className="text-3xl text-foreground">
            {t('plansTitle')}
          </h2>
          <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
            <SupporterPlans searchParams={searchParams} />
          </Suspense>
        </section>
      </Container>
    </>
  );
}
