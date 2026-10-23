import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ButtonLink, buttonClasses } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge } from '@/components/ui/data-state';
import { Panel } from '@/components/ui/panel';
import { requireAdmin } from '@/features/admin/session';
import { setRequestStatusAction } from '@/features/community/actions';
import { getAllCreators, getCreatorRequests } from '@/features/community/queries';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin.community');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default function AdminCommunityPage() {
  return (
    <Container className="py-8 sm:py-10">
      <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
        <AdminCommunity />
      </Suspense>
    </Container>
  );
}

async function AdminCommunity() {
  await requireAdmin();
  const [creators, requests, t, tc, format, locale] = await Promise.all([
    getAllCreators(),
    getCreatorRequests('pending'),
    getTranslations('Admin.community'),
    getTranslations('Community'),
    getFormatter(),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            {t('backToAdmin')}
          </Link>
          <h1 className="mt-2 text-4xl text-foreground">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('count', {
              published: creators.filter((c) => c.status === 'published').length,
              total: creators.length,
            })}
          </p>
        </div>
        <ButtonLink href="/admin/community/new">{t('new')}</ButtonLink>
      </header>

      <Panel title={t('requestsTitle', { count: requests.length })} titleId="requests">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('requestsEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-sm border border-border bg-background/40 p-3">
                <p className="font-semibold text-foreground">
                  {r.displayName}{' '}
                  <span className="font-normal text-muted-foreground">
                    · {t(`requestKind.${r.kind}`)} · {format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' })}
                  </span>
                </p>
                <p className="text-sm break-words whitespace-pre-line text-neon">{r.links}</p>
                {r.message && <p className="text-sm whitespace-pre-line text-muted-foreground">{r.message}</p>}
                <div className="flex flex-wrap gap-2">
                  {r.kind === 'join' && (
                    <Link
                      href={`/admin/community/new?name=${encodeURIComponent(r.displayName)}`}
                      className={buttonClasses('secondary', 'sm')}
                    >
                      {t('createFromRequest')}
                    </Link>
                  )}
                  {(['approved', 'rejected'] as const).map((status) => (
                    <form key={status} action={setRequestStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={status} />
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className={buttonClasses('ghost', 'sm')}>
                        {t(`requestAction.${status}`)}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ul className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {creators.map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/community/${c.id}`}
              className="frame flex items-center justify-between gap-3 px-4 py-3 hover:border-neon/60"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {c.channels.map((ch) => tc(`platforms.${ch.platform}`)).join(' · ')}
                  {c.featured ? ` · ${t('featuredShort')}` : ''}
                </span>
              </span>
              <DataStateBadge
                state={c.status === 'published' ? 'ok' : c.status === 'draft' ? 'stale' : 'empty'}
                label={t(`statusShort.${c.status}`)}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
