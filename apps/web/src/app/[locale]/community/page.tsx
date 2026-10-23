import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ClassArt } from '@/components/brand/class-art';
import { Container } from '@/components/ui/container';
import { CommunityView } from '@/features/community/community-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Community');
  return { title: t('metaTitle'), description: t('intro') };
}

export default function CommunityPage({ searchParams }: PageProps<'/[locale]/community'>) {
  const t = useTranslations('Community');
  return (
    <>
      <section className="hex-grid border-b border-border/60">
        <Container className="grid items-center gap-6 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:py-14">
          <div className="flex max-w-3xl flex-col gap-3">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="text-4xl text-foreground sm:text-6xl">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">{t('intro')}</p>
            <p className="text-xs text-muted-foreground">{t('curated')}</p>
          </div>
          <div className="mx-auto hidden w-full max-w-sm lg:block">
            <ClassArt name="monk" sizes="384px" />
          </div>
        </Container>
      </section>
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <CommunityView searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}
