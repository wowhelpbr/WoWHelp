import { mountStatusFor, type CollectionStatus, type Locale } from '@wowhelp/shared';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { buttonClasses } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { inputClasses } from '@/components/ui/field';
import { getCurrentUser } from '@/features/auth/session';
import { PAGE_SIZE, filterMounts, parseFilters, sourceOptions } from '@/features/catalog/filter';
import { getCatalogMounts, getMyMountData } from '@/features/catalog/queries';
import { CollectibleCard } from '@/features/catalog/collectible-card';
import { MountStatusBadge } from '@/features/catalog/status-badge';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Mounts');
  return { title: t('metaTitle'), description: t('intro') };
}

export default function MountsPage({ searchParams }: PageProps<'/[locale]/mounts'>) {
  const t = useTranslations('Mounts');
  return (
    <Container className="flex flex-col gap-6 py-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        <p className="max-w-3xl text-muted-foreground">{t('intro')}</p>
        <p className="text-xs text-muted-foreground">{t('attribution')}</p>
      </header>
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <MountCatalog searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function MountCatalog({ searchParams }: { searchParams: PageProps<'/[locale]/mounts'>['searchParams'] }) {
  await connection();
  const locale = (await getLocale()) as Locale;
  const [sp, result, user, t] = await Promise.all([
    searchParams,
    getCatalogMounts(locale),
    getCurrentUser(),
    getTranslations('Mounts'),
  ]);

  if (result.status === 'error') return <StateNotice state="sync_failed" title={t('unavailable')} />;
  if (result.status === 'not_configured' || result.mounts.length === 0) {
    return (
      <StateNotice state="loading" title={t('reviewTitle')}>
        {t('reviewBody')}
      </StateNotice>
    );
  }

  const filters = parseFilters(sp);
  const mine = user ? await getMyMountData() : null;
  const now = new Date();
  const statusMap = new Map<string, ReturnType<typeof mountStatusFor>>();
  const statusOf = mine
    ? (id: string): CollectionStatus => {
        let s = statusMap.get(id);
        if (!s) {
          s = mountStatusFor(id, mine.observations, {
            syncedAt: mine.accountSyncedAt,
            addonObservedAt: mine.addonObservedAt,
            now,
          });
          statusMap.set(id, s);
        }
        return s.status;
      }
    : undefined;

  const filtered = filterMounts(result.mounts, filters, statusOf);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const query = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | number> = {
      q: filters.q,
      source: filters.source,
      faction: filters.faction,
      status: filters.status,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v === '' || (k === 'page' && Number(v) === 1)) continue;
      p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `/mounts?${s}` : '/mounts';
  };

  return (
    <div className="flex flex-col gap-5">
      <form
        method="get"
        className="frame grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] xl:items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mount-q" className="text-sm font-medium text-foreground">
            {t('searchLabel')}
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="mount-q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder={t('searchPlaceholder')}
              className={cn(inputClasses, 'w-full pl-9')}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mount-source" className="text-sm font-medium text-foreground">
            {t('sourceLabel')}
          </label>
          <select id="mount-source" name="source" defaultValue={filters.source} className={cn(inputClasses, 'w-full')}>
            <option value="">{t('sourceAll')}</option>
            {sourceOptions(result.mounts).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mount-faction" className="text-sm font-medium text-foreground">
            {t('factionLabel')}
          </label>
          <select
            id="mount-faction"
            name="faction"
            defaultValue={filters.faction}
            className={cn(inputClasses, 'w-full')}
          >
            <option value="">{t('factionAll')}</option>
            <option value="ALLIANCE">{t('factions.ALLIANCE')}</option>
            <option value="HORDE">{t('factions.HORDE')}</option>
          </select>
        </div>
        {user ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mount-status" className="text-sm font-medium text-foreground">
              {t('statusLabel')}
            </label>
            <select
              id="mount-status"
              name="status"
              defaultValue={filters.status}
              className={cn(inputClasses, 'w-full')}
            >
              <option value="">{t('statusAll')}</option>
              <option value="collected">{t('status.collected')}</option>
              <option value="not_collected">{t('status.not_collected')}</option>
              <option value="unknown">{t('status.unknown')}</option>
            </select>
          </div>
        ) : (
          <p className="self-end text-sm text-muted-foreground">{t('signInForStatus')}</p>
        )}
        <div className="flex gap-2">
          <button type="submit" className={buttonClasses('primary', 'md')}>
            {t('apply')}
          </button>
          <Link href="/mounts" className={buttonClasses('ghost', 'md')}>
            {t('clear')}
          </Link>
        </div>
      </form>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('results', { count: filtered.length })}
      </p>

      {visible.length === 0 ? (
        <StateNotice state="empty" title={t('results', { count: 0 })}>
          {t('noResults')}
        </StateNotice>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((mount) => (
            <li key={mount.id}>
              <CollectibleCard
                href={`/mounts/${mount.externalId}`}
                name={mount.name}
                subtitle={mount.sourceName ?? t('sourceUnknown')}
                imageUrl={mount.imageUrl}
                badges={
                  mount.faction || statusOf ? (
                    <>
                      {mount.faction && (
                        <DataStateBadge
                          state="ok"
                          label={t('factionOnly', { faction: t(`factions.${mount.faction}`) })}
                        />
                      )}
                      {statusOf && <MountStatusBadge status={statusOf(mount.externalId)} />}
                    </>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label={t('page', { page, pages })}>
          {page > 1 ? (
            <Link href={query({ page: page - 1 })} className={buttonClasses('secondary', 'sm')}>
              {t('previous')}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">{t('page', { page, pages })}</span>
          {page < pages ? (
            <Link href={query({ page: page + 1 })} className={buttonClasses('secondary', 'sm')}>
              {t('next')}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
