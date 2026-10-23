import { ArrowDown, BookOpenCheck, Plug, UserRoundPen } from 'lucide-react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ClassArt } from '@/components/brand/class-art';
import { Container } from '@/components/ui/container';
import { DataStateBadge } from '@/components/ui/data-state';
import { FocusPicker } from '@/features/onboarding/focus-picker';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Home');
  return { title: { absolute: `WoWHelp · ${t('metaTitle')}` } };
}

export default function HomePage() {
  const t = useTranslations('Home');
  const ta = useTranslations('Availability');

  const sources = [
    { key: 'manual', icon: UserRoundPen, available: true },
    { key: 'battlenet', icon: Plug, phase: 2 },
    { key: 'addon', icon: BookOpenCheck, phase: 5 },
  ] as const;

  return (
    <>
      {/* Herói em tela cheia: colmeia do Nexus, brilho azul e a ilustração oficial grande. */}
      <section className="hex-grid relative overflow-hidden border-b border-border lg:min-h-[calc(100svh-4rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_75%_at_78%_45%,rgb(60_200_255/0.16),transparent_70%),radial-gradient(45%_60%_at_10%_10%,rgb(76_54_196/0.35),transparent_70%),linear-gradient(180deg,transparent_60%,var(--color-background))]"
        />
        <Container className="relative grid min-h-[inherit] items-center gap-4 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-0">
          <div className="max-w-3xl">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1] text-foreground sm:text-6xl lg:text-7xl 2xl:text-8xl">
              {t('heading')}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground lg:text-xl">{t('intro')}</p>
            <a
              href="#objetivos"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-sm bg-primary px-6 font-semibold tracking-wide text-primary-foreground uppercase shadow-[inset_0_-2px_0_rgb(0_0_0/0.22)] hover:bg-[#ffd65c]"
            >
              {t('pickerTitle')}
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </div>
          {/* O único momento de movimento da página: o mago chega uma vez. */}
          <div className="hero-art relative hidden self-end md:block lg:-mr-6 2xl:-mr-10">
            <ClassArt
              name="mage"
              priority
              sizes="(min-width: 1536px) 900px, (min-width: 1024px) 55vw, (min-width: 768px) 90vw, 0px"
              className="mx-auto max-h-[78svh] w-auto object-contain"
            />
          </div>
        </Container>
      </section>

      <Container className="scroll-mt-20 pt-10 pb-36 lg:pb-16">
        <div id="objetivos" className="mb-6 flex scroll-mt-24 flex-wrap items-end justify-between gap-2">
          <h2 className="text-3xl text-foreground sm:text-4xl">{t('pickerTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('pickerHint')}</p>
        </div>
        <FocusPicker />
      </Container>

      <Container className="grid gap-10 pb-10 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="how-title">
          <h2 id="how-title" className="text-2xl text-foreground sm:text-3xl">
            {t('howTitle')}
          </h2>
          {/* É uma sequência de verdade, então a lista é numerada. */}
          <ol className="mt-6 flex flex-col gap-5">
            {(['choose', 'connect', 'plan'] as const).map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="quest-mark" data-state={index === 0 ? 'accepted' : 'available'} aria-hidden>
                  {index + 1}
                </span>
                <p className="pt-1 text-lg text-muted-foreground">{t(`howSteps.${step}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className="text-2xl text-foreground sm:text-3xl">
            {t('sourcesTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('sourcesIntro')}</p>
          <ul className="mt-5 grid gap-3 lg:grid-cols-1 xl:grid-cols-3">
            {sources.map((source) => {
              const Icon = source.icon;
              return (
                <li key={source.key} className="frame flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-sm border border-border bg-background/60">
                      <Icon aria-hidden className="size-5 text-neon" />
                    </span>
                    {'available' in source ? (
                      <DataStateBadge state="ok" label={ta('available')} />
                    ) : (
                      <DataStateBadge state="not_available" label={ta('planned', { phase: source.phase })} />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t(`sources.${source.key}.title`)}</h3>
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
