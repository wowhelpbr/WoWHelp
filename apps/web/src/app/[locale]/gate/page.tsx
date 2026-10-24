import { Lock } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ClassArt } from '@/components/brand/class-art';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Field } from '@/components/ui/field';
import { LOCALE_PREFIX, type AppLocale } from '@/i18n/routing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Gate');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

/** Página da senha enquanto o site está em testes. */
export default async function GatePage({ searchParams }: PageProps<'/[locale]/gate'>) {
  const t = await getTranslations('Gate');
  return (
    <Container className="grid min-h-[75svh] items-center gap-8 py-12 lg:grid-cols-2">
      <div className="flex max-w-md flex-col gap-4">
        <Lock aria-hidden className="size-8 text-primary" />
        <h1 className="text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('body')}</p>
        <Suspense fallback={<div className="h-40 animate-pulse" aria-hidden />}>
          <GateForm searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="mx-auto hidden w-full max-w-lg lg:block">
        <ClassArt name="warrior" sizes="512px" />
      </div>
    </Container>
  );
}

async function GateForm({ searchParams }: { searchParams: PageProps<'/[locale]/gate'>['searchParams'] }) {
  const [sp, t, locale] = await Promise.all([searchParams, getTranslations('Gate'), getLocale()]);
  const prefix = LOCALE_PREFIX[locale as AppLocale];
  const next = typeof sp.next === 'string' ? sp.next : prefix;
  return (
    <form method="post" action="/api/gate" className="frame corner-brackets flex flex-col gap-4 p-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="prefix" value={prefix} />
      <Field
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        label={t('password')}
        error={sp.erro === '1' ? t('wrong') : undefined}
      />
      <Button type="submit" className="self-start">
        {t('enter')}
      </Button>
    </form>
  );
}
