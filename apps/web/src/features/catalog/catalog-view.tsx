import type { Locale } from '@wowhelp/shared';
import { Filter, MapPin, Search, X } from 'lucide-react';
import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/button';
import { StateNotice } from '@/components/ui/data-state';
import { AdSlot } from '@/features/ads/ads';
import { RevealItem } from '@/features/gamification/motion';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { CollectibleCard } from './collectible-card';
import { getStatusOf } from './collection-status';
import { PAGE_SIZE, categoryOptions, filterMounts, parseFilters, sourceOptions } from './filter';
import { CATALOG_PATH, IMAGE_MODE, type CatalogKind } from './kinds';
import { getCatalog } from './queries';
import { MountStatusChip } from './status-badge';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Botões de filtro (proposta neon): ativo com contorno ciano.
const chip = (active: boolean) =>
  cn(
    'inline-flex min-h-8 items-center gap-1.5 rounded-sm px-3 font-display text-[0.6875rem] font-bold tracking-[0.08em] uppercase transition-colors',
    active
      ? 'bg-card-raised text-foreground shadow-[inset_0_0_0_1px_rgb(24_247_247/0.5)] [&>svg]:text-neon'
      : 'bg-card text-muted-foreground hover:bg-card-raised hover:text-foreground',
  );

/** Lista de um catálogo (montarias, mascotes ou brinquedos) com busca, filtros e o status da coleção. */
export async function CatalogView({ kind, searchParams }: { kind: CatalogKind; searchParams: SearchParams }) {
  await connection();
  const locale = (await getLocale()) as Locale;
  const [sp, result, statusOf, t, tk] = await Promise.all([
    searchParams,
    getCatalog(kind, locale),
    getStatusOf(kind),
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
  const filtered = filterMounts(result.items, filters, statusOf);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categories = categoryOptions(result.items);
  const sources = sourceOptions(result.items);
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
  // Clicar de novo no filtro ativo desliga.
  const toggle = (key: 'source' | 'category' | 'faction', value: string) =>
    query({ [key]: filters[key] === value ? '' : value, page: 1 });
  const anyFilter = Boolean(filters.q || filters.source || filters.category || filters.faction || filters.status);

  return (
    <div className="flex flex-col gap-5">
      {/* Barra fixa: busca, minha coleção e filtros em botões. */}
      <div className="sticky top-16 z-20 flex flex-col gap-3 bg-background/90 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <form method="get" className="flex min-w-0 flex-[1_1_20rem] sm:max-w-xl">
            {filters.source && <input type="hidden" name="source" value={filters.source} />}
            {filters.category && <input type="hidden" name="category" value={filters.category} />}
            {filters.faction && <input type="hidden" name="faction" value={filters.faction} />}
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            <label htmlFor="catalog-q" className="sr-only">
              {tk('searchLabel')}
            </label>
            <div className="relative w-full">
              <input
                id="catalog-q"
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder={tk('searchPlaceholder')}
                className="min-h-10 w-full rounded-sm border border-transparent bg-card-raised pr-11 pl-3.5 text-foreground placeholder:text-faint focus:border-primary focus:shadow-[0_0_18px_rgb(197_251_20/0.25)] focus:outline-none"
              />
              <button
                type="submit"
                aria-label={t('apply')}
                className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:bg-white/5 hover:text-primary"
              >
                <Search aria-hidden className="size-4" />
              </button>
            </div>
          </form>

          {statusOf ? (
            <nav aria-label={t('statusLabel')} className="flex gap-1 rounded-md bg-sidebar p-1">
              {(
                [
                  ['', t('statusAll')],
                  ['not_collected', t('filterMissing')],
                  ['collected', t('filterOwned')],
                ] as const
              ).map(([value, label]) => {
                const active = filters.status === value;
                return (
                  <Link
                    key={value || 'all'}
                    href={query({ status: value, page: 1 })}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'inline-flex min-h-8 items-center rounded px-3.5 font-display text-[0.6875rem] font-bold tracking-[0.08em] uppercase transition-colors',
                      active
                        ? 'glow-purple bg-purple text-white'
                        : 'bg-card-raised text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <p className="text-sm text-muted-foreground">{tk('signInForStatus')}</p>
          )}

          {anyFilter && (
            <Link href={path} className={buttonClasses('ghost', 'sm')}>
              <X aria-hidden className="size-3.5" />
              {t('clear')}
            </Link>
          )}
        </div>

        <nav aria-label={t('filterGroup')} className="flex flex-wrap items-center gap-1.5">
          {sources.map((o) => (
            <Link
              key={o.value}
              href={toggle('source', o.value)}
              aria-current={filters.source === o.value ? 'true' : undefined}
              className={chip(filters.source === o.value)}
            >
              {filters.source === o.value && <Filter aria-hidden className="size-3.5" />}
              {o.label}
            </Link>
          ))}
          {categories.length > 0 && <span aria-hidden className="mx-1 h-5 w-px bg-border" />}
          {categories.map((o) => (
            <Link
              key={o.value}
              href={toggle('category', o.value)}
              aria-current={filters.category === o.value ? 'true' : undefined}
              className={chip(filters.category === o.value)}
            >
              {filters.category === o.value && <Filter aria-hidden className="size-3.5" />}
              {o.label}
            </Link>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          {(['ALLIANCE', 'HORDE'] as const).map((f) => (
            <Link
              key={f}
              href={toggle('faction', f)}
              aria-current={filters.faction === f ? 'true' : undefined}
              className={chip(filters.faction === f)}
            >
              {filters.faction === f && <Filter aria-hidden className="size-3.5" />}
              {t(`factions.${f}`)}
            </Link>
          ))}
        </nav>
      </div>

      <AdSlot placement="catalog" />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {tk('results', { count: filtered.length })}
      </p>

      {visible.length === 0 ? (
        <StateNotice state="empty" title={tk('results', { count: 0 })}>
          {t('noResults')}
        </StateNotice>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))]">
          {visible.map((item, i) => (
            <RevealItem key={item.id} index={i}>
              <CollectibleCard
                href={`${path}/${item.externalId}`}
                name={item.name}
                subtitle={
                  <>
                    <MapPin aria-hidden className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {[item.categoryName, item.sourceName ?? t('sourceUnknown')].filter(Boolean).join(' · ')}
                    </span>
                  </>
                }
                imageUrl={item.imageUrl}
                imageMode={IMAGE_MODE[kind]}
                placeholder={kind}
                owned={statusOf?.(item.externalId) === 'collected'}
                statusChip={statusOf ? <MountStatusChip status={statusOf(item.externalId)} /> : undefined}
                badges={
                  item.faction ? (
                    <span className="chip chip-grey">
                      {t('factionOnly', { faction: t(`factions.${item.faction}`) })}
                    </span>
                  ) : undefined
                }
              />
            </RevealItem>
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

/** Números do topo da página (no jogo, você tem, faltam), só com contagens reais. */
export async function CatalogStats({ kind }: { kind: CatalogKind }) {
  await connection();
  const locale = (await getLocale()) as Locale;
  const [result, statusOf, t] = await Promise.all([
    getCatalog(kind, locale),
    getStatusOf(kind),
    getTranslations('Catalog'),
  ]);
  if (result.status !== 'ok' || result.items.length === 0) return null;
  // O que o catálogo mostra (itens escondidos até coletar só contam para quem tem).
  const shown = filterMounts(result.items, parseFilters({}), statusOf);
  // Sem nenhuma leitura da coleção (tudo desconhecido), "você tem 0" enganaria: mostra só o total.
  const known = statusOf ? shown.some((i) => statusOf(i.externalId) !== 'unknown') : false;
  const owned = known ? shown.filter((i) => statusOf!(i.externalId) === 'collected').length : null;
  const missing = known ? shown.filter((i) => statusOf!(i.externalId) === 'not_collected').length : null;
  const number = new Intl.NumberFormat(locale);
  const tiles: { key: 'statTotal' | 'statOwned' | 'statMissing'; value: number; hot: boolean }[] = [
    { key: 'statTotal', value: shown.length, hot: false },
    ...(owned !== null ? [{ key: 'statOwned' as const, value: owned, hot: true }] : []),
    ...(missing !== null ? [{ key: 'statMissing' as const, value: missing, hot: false }] : []),
  ];
  return (
    <dl aria-label={t('statsLabel')} className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:min-w-[34rem]">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={
            tile.hot
              ? 'glow-lime flex flex-col gap-1.5 rounded-lg bg-primary px-4 py-3 text-primary-foreground'
              : 'flex flex-col gap-1.5 rounded-lg border border-border-soft bg-sidebar px-4 py-3'
          }
        >
          <dt className={tile.hot ? 'label text-primary-foreground/75' : 'label'}>{t(tile.key)}</dt>
          <dd className="font-display text-2xl leading-none font-bold tabular-nums sm:text-3xl">
            {number.format(tile.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
