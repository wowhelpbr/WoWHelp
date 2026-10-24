import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ClassArt } from '@/components/brand/class-art';
import { Container } from '@/components/ui/container';
import { CommunityView, PlatformFilter } from '@/features/community/community-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Community');
  return { title: t('metaTitle'), description: t('intro') };
}

export default function CommunityPage({ searchParams }: PageProps<'/[locale]/community'>) {
  const t = useTranslations('Community');
  return (
    <>
      <section className="hex-grid relative overflow-hidden border-b border-border-soft">
        <Container className="grid items-center gap-8 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:py-16">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="text-[2.75rem] leading-[0.95] text-foreground sm:text-6xl xl:text-7xl">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">{t('intro')}</p>
            <p className="text-xs text-faint">{t('curated')}</p>
            <Suspense fallback={<div className="h-10 w-80 rounded-md bg-sidebar" aria-hidden />}>
              <PlatformFilter searchParams={searchParams} />
            </Suspense>
          </div>
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div
              aria-hidden
              className="absolute inset-[8%] bg-[radial-gradient(closest-side,rgb(122_20_248/0.35),transparent_70%)] blur-md"
            />
            <ClassArt name="monk" sizes="448px" className="relative w-full drop-shadow-[0_20px_50px_rgb(0_0_0/0.6)]" />
          </div>
        </Container>
      </section>
      <Container className="py-10 sm:py-12">
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <CommunityView searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}
