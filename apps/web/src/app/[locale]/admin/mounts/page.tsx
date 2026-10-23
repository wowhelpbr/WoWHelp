import type { Locale } from '@wowhelp/shared';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { buttonClasses } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge } from '@/components/ui/data-state';
import { inputClasses } from '@/components/ui/field';
import { requireAdmin } from '@/features/admin/session';
import { getCatalogMounts } from '@/features/catalog/queries';
import { getGuideStatuses } from '@/features/guides/queries';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin');
  return { title: t('mountsTitle'), robots: { index: false, follow: false } };
}

const LIMIT = 80;

export default function AdminMountsPage({ searchParams }: PageProps<'/[locale]/admin/mounts'>) {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <AdminMounts searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

async function AdminMounts({ searchParams }: { searchParams: PageProps<'/[locale]/admin/mounts'>['searchParams'] }) {
  await requireAdmin();
  const locale = (await getLocale()) as Locale;
  const [sp, catalog, statuses, t] = await Promise.all([
    searchParams,
    getCatalogMounts(locale),
    getGuideStatuses('mount'),
    getTranslations('Admin'),
  ]);
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 80) : '';
  const only = sp.only === 'approved' || sp.only === 'draft' || sp.only === 'none' ? sp.only : '';
  const mounts = catalog.status === 'ok' ? catalog.mounts : [];
  const term = fold(q.trim());
  const filtered = mounts.filter((m) => {
    if (term && !fold(m.name).includes(term) && m.externalId !== term) return false;
    const s = statuses.get(m.externalId);
    if (only === 'none') return !s;
    if (only) return s === only;
    return true;
  });
  // Curadas primeiro: é o que se revisita.
  filtered.sort((a, b) => Number(statuses.has(b.externalId)) - Number(statuses.has(a.externalId)));
  const approvedCount = [...statuses.values()].filter((s) => s === 'approved').length;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          {t('backToAdmin')}
        </Link>
        <h1 className="mt-2 text-4xl text-foreground">{t('mountsTitle')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('mountsCount', { approved: approvedCount, drafts: statuses.size - approvedCount, total: mounts.length })}
        </p>
      </header>

      <form method="get" className="frame grid gap-3 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-q" className="text-sm font-medium text-foreground">
            {t('search')}
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input id="admin-q" name="q" type="search" defaultValue={q} className={cn(inputClasses, 'w-full pl-9')} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-only" className="text-sm font-medium text-foreground">
            {t('filter')}
          </label>
          <select id="admin-only" name="only" defaultValue={only} className={cn(inputClasses, 'w-full')}>
            <option value="">{t('filterAll')}</option>
            <option value="approved">{t('guide.statusApproved')}</option>
            <option value="draft">{t('guide.statusDraft')}</option>
            <option value="none">{t('guide.statusNone')}</option>
          </select>
        </div>
        <button type="submit" className={buttonClasses('primary', 'md')}>
          {t('apply')}
        </button>
      </form>

      <ul className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.slice(0, LIMIT).map((m) => {
          const s = statuses.get(m.externalId);
          return (
            <li key={m.id}>
              <Link
                href={`/admin/mounts/${m.externalId}`}
                className="frame flex items-center justify-between gap-3 px-4 py-3 hover:border-neon/60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">
                    #{m.externalId} · {m.sourceName ?? t('noSource')}
                  </span>
                </span>
                <DataStateBadge
                  state={s === 'approved' ? 'ok' : s === 'draft' ? 'stale' : 'empty'}
                  label={
                    s === 'approved'
                      ? t('guide.statusApproved')
                      : s === 'draft'
                        ? t('guide.statusDraft')
                        : t('guide.statusNone')
                  }
                />
              </Link>
            </li>
          );
        })}
      </ul>
      {filtered.length > LIMIT && (
        <p className="text-sm text-muted-foreground">{t('refine', { count: filtered.length })}</p>
      )}
    </div>
  );
}
