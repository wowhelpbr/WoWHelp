import type { Metadata } from 'next';
import { connection } from 'next/server';
import { useTranslations } from 'next-intl';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Container } from '@/components/ui/container';
import { StateNotice } from '@/components/ui/data-state';
import { getPublishedMounts } from '@/features/catalog/queries';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Mounts');
  return { title: t('metaTitle'), description: t('intro') };
}

export default function MountsPage() {
  const t = useTranslations('Mounts');
  return (
    <Container className="flex flex-col gap-6 py-8 sm:py-10">
      <header className="max-w-3xl">
        <h1 className="text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('intro')}</p>
      </header>
      <Suspense fallback={<div className="frame h-32 animate-pulse" aria-hidden />}>
        <MountCatalog />
      </Suspense>
    </Container>
  );
}

/**
 * Lido a cada requisição por enquanto: o catálogo ainda está vazio e o
 * banco pode não existir no build. Cache com "use cache" entra na Fase 3,
 * junto com o conteúdo revisado.
 */
async function MountCatalog() {
  await connection();
  const locale = await getLocale();
  const [result, t, format] = await Promise.all([
    getPublishedMounts(locale as 'en-US' | 'pt-BR'),
    getTranslations('Mounts'),
    getFormatter(),
  ]);

  if (result.status === 'error') return <StateNotice state="sync_failed" title={t('unavailable')} />;
  if (result.status === 'not_configured' || result.mounts.length === 0) {
    return (
      <StateNotice state="empty" title={t('reviewTitle')}>
        {t('reviewBody')}
      </StateNotice>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {result.mounts.map((mount) => (
        <li key={mount.id} className="frame flex flex-col gap-2 p-4">
          <h2 className="text-xl text-primary">{mount.name}</h2>
          {mount.summary && <p className="text-sm text-muted-foreground">{mount.summary}</p>}
          <p className="mt-auto flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {mount.expansion && <span>{mount.expansion}</span>}
            {mount.lastReviewedAt && (
              <span>
                {t('reviewedOn', { date: format.dateTime(new Date(mount.lastReviewedAt), { dateStyle: 'medium' }) })}
              </span>
            )}
            {mount.sourceUrl && (
              <a href={mount.sourceUrl} rel="noopener noreferrer" target="_blank" className="text-neon hover:underline">
                {t('source')}
              </a>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
