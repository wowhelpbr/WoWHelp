import { mountStatusFor, type Locale } from '@wowhelp/shared';
import { ArrowLeft, Check, CircleSlash, Target, X } from 'lucide-react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { buttonClasses } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { getCurrentUser } from '@/features/auth/session';
import { createMountGoalAction, setMountManualAction } from '@/features/catalog/actions';
import { getCatalogMounts, getMyMountData } from '@/features/catalog/queries';
import { MountStatusBadge } from '@/features/catalog/status-badge';
import { Link } from '@/i18n/navigation';
import { LOCALE_PREFIX } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/mounts/[id]'>): Promise<Metadata> {
  const { id, locale } = await params;
  const result = await getCatalogMounts(locale as Locale);
  const mount = result.status === 'ok' ? result.mounts.find((m) => m.externalId === id) : undefined;
  const t = await getTranslations('Mounts');
  return mount
    ? { title: mount.name, description: mount.summary ?? t('intro') }
    : { title: t('metaTitle'), robots: { index: false } };
}

export default function MountPage({ params }: PageProps<'/[locale]/mounts/[id]'>) {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <Mount params={params} />
      </Suspense>
    </Container>
  );
}

async function Mount({ params }: { params: PageProps<'/[locale]/mounts/[id]'>['params'] }) {
  await connection();
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const [result, user, t, format] = await Promise.all([
    getCatalogMounts(locale),
    getCurrentUser(),
    getTranslations('Mounts'),
    getFormatter(),
  ]);
  const mount =
    result.status === 'ok' && /^\d{1,20}$/.test(id) ? result.mounts.find((m) => m.externalId === id) : undefined;

  if (!mount) {
    return (
      <div className="flex flex-col gap-4">
        <StateNotice state="empty" title={t('notFound')} />
        <Link href="/mounts" className={buttonClasses('secondary', 'sm') + ' self-start'}>
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const mine = user ? await getMyMountData() : null;
  const status = mine
    ? mountStatusFor(mount.externalId, mine.observations, { syncedAt: mine.accountSyncedAt, now: new Date() })
    : null;
  const manual = mine?.observations.find((o) => o.externalItemId === mount.externalId && o.source === 'manual');
  const back = `${LOCALE_PREFIX[locale]}/mounts/${mount.externalId}`;

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-5">
        <Link
          href="/mounts"
          className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t('backToCatalog')}
        </Link>
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl text-foreground sm:text-5xl">{mount.name}</h1>
          <div className="flex flex-wrap gap-2">
            {status && <MountStatusBadge status={status.status} />}
            {mount.faction && (
              <DataStateBadge state="ok" label={t('factionOnly', { faction: t(`factions.${mount.faction}`) })} />
            )}
          </div>
        </header>
        {mount.summary && (
          <section aria-labelledby="desc" className="frame p-5">
            <h2 id="desc" className="eyebrow">
              {t('description')}
            </h2>
            <p className="mt-2 max-w-prose text-lg text-foreground">{mount.summary}</p>
          </section>
        )}
        <section aria-labelledby="how" className="frame p-5">
          <h2 id="how" className="eyebrow">
            {t('howToGet')}
          </h2>
          <p className="mt-2 text-lg text-foreground">{mount.sourceName ?? t('sourceUnknown')}</p>
        </section>
        <p className="text-xs text-muted-foreground">
          {t('attribution')} {t('blizzardId', { id: mount.externalId })}
          {mount.fetchedAt
            ? ` · ${t('updated', { when: format.relativeTime(new Date(mount.fetchedAt), new Date()) })}`
            : ''}
        </p>
      </div>

      <aside className="frame corner-brackets flex h-fit flex-col gap-4 p-5">
        <form action={createMountGoalAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="collectibleId" value={mount.id} />
          <input type="hidden" name="back" value={back} />
          <button type="submit" className={buttonClasses('primary', 'md', 'w-full')}>
            <Target aria-hidden className="size-4" />
            {t('createGoal')}
          </button>
        </form>

        {user ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {status?.source ? t(`statusHelp.${status.source}`) : t('statusHelp.unknown')}
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={setMountManualAction}>
                <input type="hidden" name="externalId" value={mount.externalId} />
                <input type="hidden" name="status" value="collected" />
                <button type="submit" className={buttonClasses('secondary', 'sm')}>
                  <Check aria-hidden className="size-4" />
                  {t('markCollected')}
                </button>
              </form>
              <form action={setMountManualAction}>
                <input type="hidden" name="externalId" value={mount.externalId} />
                <input type="hidden" name="status" value="not_collected" />
                <button type="submit" className={buttonClasses('ghost', 'sm')}>
                  <CircleSlash aria-hidden className="size-4" />
                  {t('markNotCollected')}
                </button>
              </form>
              {manual && (
                <form action={setMountManualAction}>
                  <input type="hidden" name="externalId" value={mount.externalId} />
                  <input type="hidden" name="status" value="clear" />
                  <button type="submit" className={buttonClasses('ghost', 'sm')}>
                    <X aria-hidden className="size-4" />
                    {t('clearManual')}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('signInForStatus')}</p>
        )}
      </aside>
    </article>
  );
}
