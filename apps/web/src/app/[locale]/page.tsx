import {
  ArrowDown,
  BookOpenCheck,
  Gift,
  Link2,
  ListChecks,
  PawPrint,
  Plug,
  Target,
  UserRoundPen,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ClassArt } from '@/components/brand/class-art';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { buttonClasses, ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge } from '@/components/ui/data-state';
import { AdSlot } from '@/features/ads/ads';
import { FocusPicker } from '@/features/onboarding/focus-picker';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Home');
  return { title: { absolute: `WoWHelp · ${t('metaTitle')}` } };
}

export default function HomePage() {
  const t = useTranslations('Home');
  const ta = useTranslations('Availability');
  const tc = useTranslations('Catalog');
  const tn = useTranslations('Nav');

  // A última palavra da pergunta ganha o neon ("hoje?" / "today?").
  const heading = t('heading');
  const cut = heading.lastIndexOf(' ');

  const sources = [
    { key: 'manual', icon: UserRoundPen },
    { key: 'battlenet', icon: Plug },
    { key: 'addon', icon: BookOpenCheck },
  ] as const;

  const shortcuts = [
    { href: '/mounts', label: tc('mount.tab'), icon: MountGlyph },
    { href: '/pets', label: tc('pet.tab'), icon: PawPrint },
    { href: '/toys', label: tc('toy.tab'), icon: Gift },
    { href: '/community', label: tn('community'), icon: Users },
  ] as const;

  return (
    <>
      {/* Herói em tela cheia: grade com luz limão e roxa e a ilustração oficial grande. */}
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
        <Container className="relative grid min-h-[inherit] items-center gap-6 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-0">
          <div className="max-w-3xl">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="mt-5 text-[2.75rem] leading-[0.95] text-foreground sm:text-6xl lg:text-7xl 2xl:text-8xl">
              {cut > 0 ? heading.slice(0, cut) : heading}{' '}
              {cut > 0 && (
                <span className="text-primary [text-shadow:0_0_30px_rgb(197_251_20/0.45)]">
                  {heading.slice(cut + 1)}
                </span>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground lg:text-xl">{t('intro')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#objetivos" className={buttonClasses('primary', 'lg', undefined, 'skew')}>
                {t('pickerTitle')}
                <ArrowDown aria-hidden className="size-4" />
              </a>
              <ButtonLink href="/mounts" variant="secondary" size="lg">
                {t('browseCollections')}
              </ButtonLink>
            </div>
          </div>
          {/* O único momento de movimento da página: o mago chega uma vez. */}
          <div className="hero-art relative hidden self-end md:block lg:-mr-6 2xl:-mr-10">
            <div
              aria-hidden
              className="absolute inset-x-[5%] top-[10%] bottom-0 bg-[radial-gradient(closest-side,rgb(122_20_248/0.38),transparent_70%)] blur-md"
            />
            <ClassArt
              name="mage"
              priority
              sizes="(min-width: 1536px) 900px, (min-width: 1024px) 55vw, (min-width: 768px) 90vw, 0px"
              className="relative mx-auto max-h-[78svh] w-auto object-contain drop-shadow-[0_30px_60px_rgb(0_0_0/0.6)]"
            />
            <nav
              aria-label={t('shortcutsTitle')}
              className="glass absolute top-[14%] left-0 hidden w-64 flex-col gap-1.5 p-4 lg:flex 2xl:w-72"
            >
              <p className="label mb-1">{t('shortcutsTitle')}</p>
              {shortcuts.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-md px-2 py-2 font-display text-xs font-bold tracking-[0.06em] text-foreground uppercase hover:bg-white/5 [&:hover>svg]:text-primary"
                >
                  <Icon aria-hidden className="size-4 text-neon transition-colors" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </Container>
      </section>

      <Container className="scroll-mt-20 pt-12 pb-36 lg:pb-16">
        <div id="objetivos" className="mb-6 flex scroll-mt-24 flex-wrap items-end justify-between gap-2">
          <h2 className="text-3xl text-foreground sm:text-4xl">{t('pickerTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('pickerHint')}</p>
        </div>
        <FocusPicker />
        <AdSlot placement="home" className="mt-8" />
      </Container>

      <Container className="flex flex-col gap-14 pb-14">
        <section aria-labelledby="how-title">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 id="how-title" className="mt-3 text-3xl text-foreground sm:text-4xl">
            {t('howTitle')}
          </h2>
          {/* É uma sequência de verdade, então a lista é numerada. */}
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {(
              [
                ['choose', Target],
                ['connect', Link2],
                ['plan', ListChecks],
              ] as const
            ).map(([step, Icon], index) => (
              <li key={step} className="flex flex-col gap-3">
                <span className="flex items-center gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-md bg-foreground text-background"
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="label">{String(index + 1).padStart(2, '0')}</span>
                </span>
                <p className="text-lg text-muted-foreground">{t(`howSteps.${step}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="divider-glow" aria-hidden />

        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className="text-3xl text-foreground sm:text-4xl">
            {t('sourcesTitle')}
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">{t('sourcesIntro')}</p>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {sources.map((source) => {
              const Icon = source.icon;
              return (
                <li key={source.key} className="frame flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="stat-icon">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <DataStateBadge state="ok" label={ta('available')} />
                  </div>
                  <h3 className="text-base text-foreground">{t(`sources.${source.key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`sources.${source.key}.body`)}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </Container>
    </>
  );
}
