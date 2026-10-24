import { mountStatusFor, type CollectionStatus, type Locale } from '@wowhelp/shared';
import { Search } from 'lucide-react';
import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/button';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { inputClasses } from '@/components/ui/field';
import { getCurrentUser } from '@/features/auth/session';
import { AdSlot } from '@/features/ads/ads';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { CollectibleCard } from './collectible-card';
import { PAGE_SIZE, categoryOptions, filterMounts, parseFilters, sourceOptions } from './filter';
import { CATALOG_PATH, IMAGE_MODE, type CatalogKind } from './kinds';
import { getCatalog, getMyCollectionData } from './queries';
import { MountStatusBadge } from './status-badge';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Lista de um catálogo (montarias, mascotes ou brinquedos) com busca, filtros e o status da coleção. */
export async function CatalogView({ kind, searchParams }: { kind: CatalogKind; searchParams: SearchParams }) {
  await connection();
  const locale = (await getLocale()) as Locale;
  const [sp, result, user, t, tk] = await Promise.all([
    searchParams,
    getCatalog(kind, locale),
    getCurrentUser(),
    getTranslations('Mounts'),
    getTranslations(`Catalog.${kind}`),
  ]);

  if (result.status === 'error') return <StateNotice state="sync_failed" title={t('unavailable')} />;
  if (result.status === 'not_configured' || result.items.length === 0) {
    return (
      <StateNotice state="loading" title={t('reviewTitle')}>
        {t('reviewBody')}
      </StateNotice>
    );
  }

  const path = CATALOG_PATH[kind];
  const filters = parseFilters(sp);
  const mine = user ? await getMyCollectionData(kind) : null;
  const now = new Date();
  const statusMap = new Map<string, CollectionStatus>();
  const statusOf = mine
    ? (id: string): CollectionStatus => {
        let s = statusMap.get(id);
        if (!s) {
          s = mountStatusFor(id, mine.observations, {
            syncedAt: mine.accountSyncedAt,
            addonObservedAt: mine.addonObservedAt,
            now,
          }).status;
          statusMap.set(id, s);
        }
        return s;
      }
    : undefined;

  const filtered = filterMounts(result.items, filters, statusOf);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categories = categoryOptions(result.items);
  const query = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | number> = {
      q: filters.q,
      source: filters.source,
      category: filters.category,
      faction: filters.faction,
      status: filters.status,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v === '' || (k === 'page' && Number(v) === 1)) continue;
      p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `${path}?${s}` : path;
  };

  return (
    <div className="flex flex-col gap-5">
      <form
        method="get"
        className="frame grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] xl:items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="catalog-q"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {tk('searchLabel')}
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="catalog-q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder={tk('searchPlaceholder')}
              className={cn(inputClasses, 'w-full pl-9')}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="catalog-source"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {t('sourceLabel')}
          </label>
          <select
            id="catalog-source"
            name="source"
            defaultValue={filters.source}
            className={cn(inputClasses, 'w-full')}
          >
            <option value="">{t('sourceAll')}</option>
            {sourceOptions(result.items).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="catalog-category"
              className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
            >
              {t('categoryLabel')}
            </label>
            <select
              id="catalog-category"
              name="category"
              defaultValue={filters.category}
              className={cn(inputClasses, 'w-full')}
            >
              <option value="">{t('categoryAll')}</option>
              {categories.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="catalog-faction"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {t('factionLabel')}
          </label>
          <select
            id="catalog-faction"
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
            <label
              htmlFor="catalog-status"
              className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
            >
              {t('statusLabel')}
            </label>
            <select
              id="catalog-status"
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
          <p className="self-end text-sm text-muted-foreground">{tk('signInForStatus')}</p>
        )}
        <div className="flex gap-2">
          <button type="submit" className={buttonClasses('primary', 'md')}>
            {t('apply')}
          </button>
          <Link href={path} className={buttonClasses('ghost', 'md')}>
            {t('clear')}
          </Link>
        </div>
      </form>

      <AdSlot placement="catalog" />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {tk('results', { count: filtered.length })}
      </p>

      {visible.length === 0 ? (
        <StateNotice state="empty" title={tk('results', { count: 0 })}>
          {t('noResults')}
        </StateNotice>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
          {visible.map((item) => (
            <li key={item.id}>
              <CollectibleCard
                href={`${path}/${item.externalId}`}
                name={item.name}
                subtitle={[item.categoryName, item.sourceName ?? t('sourceUnknown')].filter(Boolean).join(' · ')}
                imageUrl={item.imageUrl}
                imageMode={IMAGE_MODE[kind]}
                placeholder={kind}
                badges={
                  item.faction || statusOf ? (
                    <>
                      {item.faction && (
                        <DataStateBadge
                          state="ok"
                          label={t('factionOnly', { faction: t(`factions.${item.faction}`) })}
                        />
                      )}
                      {statusOf && <MountStatusBadge status={statusOf(item.externalId)} />}
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
