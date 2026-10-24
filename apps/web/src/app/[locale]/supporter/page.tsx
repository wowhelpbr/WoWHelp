import { Check } from 'lucide-react';
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
  return (
    <>
      <section className="hex-grid border-b border-border/60">
        <Container className="grid items-center gap-6 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:py-14">
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="text-4xl text-foreground sm:text-6xl">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">{t('intro')}</p>
            <div>
              <h2 className="font-display text-lg text-primary">{t('benefitsTitle')}</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {(['benefitNoAds', 'benefitBadge', 'benefitThanks'] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2 text-foreground">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-neon" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">{t('promise')}</p>
          </div>
          <div className="mx-auto hidden w-full max-w-sm lg:block">
            <ClassArt name="priest" sizes="384px" />
          </div>
        </Container>
      </section>
      <Container className="flex flex-col gap-4 py-8 sm:py-10">
        <h2 className="text-3xl text-foreground">{t('plansTitle')}</h2>
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <SupporterPlans searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}
