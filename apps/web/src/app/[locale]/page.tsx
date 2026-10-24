import type { Locale } from '@wowhelp/shared';
import { Check, Gift, Link2, ListChecks, PawPrint, Target, Upload } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ClassArt } from '@/components/brand/class-art';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { AdSlot } from '@/features/ads/ads';
import { HomeCta, HomeFloatingStat, HomeLive, getCatalogCounts } from '@/features/home/home-parts';
import { ContinueButton, FocusPicker } from '@/features/onboarding/focus-picker';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Home');
  return { title: { absolute: `WoWHelp · ${t('metaTitle')}` } };
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const [t, counts] = await Promise.all([getTranslations('Home'), getCatalogCounts(locale)]);
  const number = new Intl.NumberFormat(locale);

  // A última palavra da pergunta ganha o neon ("hoje?" / "today?").
  const heading = t('heading');
  const cut = heading.lastIndexOf(' ');

  const stats = counts
    ? ([
        ['statMounts', number.format(counts.mount), MountGlyph],
        ['statPets', number.format(counts.pet), PawPrint],
        ['statToys', number.format(counts.toy), Gift],
      ] as const)
    : [];

  const features = [
    ['choose', Target],
    ['connect', Link2],
    ['follow', ListChecks],
    ['addon', Upload],
  ] as const;

  return (
    <>
      {/* Herói em tela cheia: pergunta, os oito objetivos e a ilustração com o rastreador. */}
      <section className="hex-grid relative overflow-hidden border-b border-border-soft lg:min-h-[calc(100svh-4rem)]">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full opacity-60"
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
        >
          <path
            d="M-50 700 C 300 450, 700 900, 1650 380"
            stroke="rgb(255 255 255 / 0.04)"
            strokeWidth="90"
            fill="none"
          />
          <path
            d="M-50 260 C 500 120, 900 520, 1650 140"
            stroke="rgb(122 20 248 / 0.07)"
            strokeWidth="60"
            fill="none"
          />
        </svg>
        <Container className="relative min-h-[inherit]">
          <FocusPicker
            intro={
              <>
                <p className="eyebrow">{t('eyebrow')}</p>
                <h1 className="text-[2.75rem] leading-[0.95] text-foreground sm:text-6xl xl:text-7xl 2xl:text-8xl">
                  {cut > 0 ? heading.slice(0, cut) : heading}{' '}
                  {cut > 0 && (
                    <span className="text-primary [text-shadow:0_0_30px_rgb(197_251_20/0.45)]">
                      {heading.slice(cut + 1)}
                    </span>
                  )}
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">{t('intro')}</p>
              </>
            }
            art={
              <ClassArt
                name="priest"
                priority
                sizes="(min-width: 1536px) 640px, (min-width: 1024px) 40vw, (min-width: 768px) 80vw, 0px"
                className="absolute right-[2%] bottom-0 h-full w-auto object-contain drop-shadow-[0_30px_60px_rgb(0_0_0/0.6)]"
              />
            }
            floating={
              <Suspense fallback={null}>
                <HomeFloatingStat />
              </Suspense>
            }
            cta={
              <Suspense fallback={<ContinueButton label={t('ctaVisitor')} />}>
                <HomeCta />
              </Suspense>
            }
            mobileCta={
              <Suspense fallback={<ContinueButton label={t('ctaVisitor')} compact />}>
                <HomeCta compact />
              </Suspense>
            }
            secondary={
              <ButtonLink href="/mounts" variant="secondary" size="lg">
                {t('browseCollections')}
              </ButtonLink>
            }
          />
        </Container>
      </section>

      <Container className="flex flex-col gap-16 pt-12 pb-36 lg:pb-16">
        {/* Números reais do catálogo; o último (grátis) ganha o neon. */}
        <dl aria-label={t('statsLabel')} className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {stats.map(([key, value, Icon]) => (
            <div
              key={key}
              className="relative flex flex-col gap-1.5 rounded-lg border border-border-soft bg-sidebar py-5 pr-5 pl-20"
            >
              <dt className="label">
                <span className="stat-icon absolute top-1/2 left-5 -translate-y-1/2">
                  <Icon aria-hidden className="size-[18px]" />
                </span>
                {t(key)}
              </dt>
              <dd className="font-display text-3xl leading-none font-bold tabular-nums">{value}</dd>
            </div>
          ))}
          <div className="glow-lime relative flex flex-col gap-1.5 rounded-lg bg-primary py-5 pr-5 pl-20 text-primary-foreground">
            <dt className="label text-primary-foreground/75">
              <span className="absolute top-1/2 left-5 grid size-[42px] -translate-y-1/2 place-items-center rounded-full bg-black/10">
                <Check aria-hidden className="size-[18px]" />
              </span>
              {t('statForYou')}
            </dt>
            <dd className="font-display text-3xl leading-none font-bold">{t('statFree')}</dd>
          </div>
        </dl>

        <AdSlot placement="home" />

        <section aria-labelledby="how-title">
          <p className="eyebrow">{t('featuresEyebrow')}</p>
          <h2 id="how-title" className="mt-3 text-3xl text-foreground sm:text-4xl">
            {t('howTitle')}
          </h2>
          {/* É uma sequência de verdade, então a lista é numerada. */}
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(([key, Icon]) => (
              <li key={key} className="flex flex-col gap-2.5">
                <span className="grid size-10 place-items-center rounded-md bg-foreground text-background" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-1 font-sans text-base font-bold tracking-normal normal-case">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-sm text-faint">{t(`features.${key}.body`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <Suspense fallback={null}>
          <HomeLive />
        </Suspense>

        <section className="glow-lime relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_110%_50%,transparent_0_22px,rgb(0_0_0/0.06)_22px_24px)]"
          />
          <div className="relative">
            <h2 className="text-3xl">{t('supporterTitle')}</h2>
            <p className="mt-2 font-semibold text-primary-foreground/75">{t('supporterBody')}</p>
          </div>
          <ButtonLink href="/supporter" variant="olive" size="lg" shape="skew" className="relative">
            {t('supporterCta')}
          </ButtonLink>
        </section>
      </Container>
    </>
  );
}
