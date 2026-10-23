import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { ClassArt } from '@/components/brand/class-art';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Offline');
  return { title: t('metaTitle'), robots: { index: false } };
}

/** Guardada pelo service worker (sem cookies) e exibida quando não há rede. */
export default function OfflinePage() {
  const t = useTranslations('Offline');
  return (
    <Container className="grid min-h-[70svh] items-center gap-8 py-12 lg:grid-cols-2">
      <div className="flex max-w-md flex-col items-start gap-4">
        <WifiOff aria-hidden className="size-8 text-muted-foreground" />
        <h1 className="text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('body')}</p>
        <ButtonLink href="/">{t('retry')}</ButtonLink>
      </div>
      <div className="mx-auto w-56 sm:w-80 lg:order-first lg:w-full lg:max-w-xl">
        <ClassArt name="priest" sizes="(min-width: 1024px) 576px, (min-width: 640px) 320px, 224px" />
      </div>
    </Container>
  );
}
