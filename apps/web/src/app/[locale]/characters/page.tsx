import type { BattlenetRegion } from '@wowhelp/shared';
import { Shield } from 'lucide-react';
import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { Container } from '@/components/ui/container';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { Panel } from '@/components/ui/panel';
import { getCurrentUser } from '@/features/auth/session';
import { ConnectForm, DisconnectForm } from '@/features/battlenet/connection-forms';
import { getMyBattlenetData, type CharacterView } from '@/features/battlenet/queries';
import { getMyProfile } from '@/features/profile/queries';
import { redirect } from '@/i18n/navigation';
import { isBattlenetConfigured } from '@/lib/blizzard/client';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Characters');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

const RESULTS = [
  'connected',
  'connected_partial',
  'denied',
  'expired',
  'invalid_state',
  'session',
  'token',
  'profile',
  'storage',
  'not_configured',
  'invalid_region',
] as const;
type Result = (typeof RESULTS)[number];

export default function CharactersPage({ searchParams }: PageProps<'/[locale]/characters'>) {
  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AccountSidebar />
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <Characters searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

async function Characters({ searchParams }: { searchParams: PageProps<'/[locale]/characters'>['searchParams'] }) {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login?next=/characters', locale });

  const [{ bnet }, data, profile, t, format] = await Promise.all([
    searchParams,
    getMyBattlenetData(),
    getMyProfile(),
    getTranslations('Characters'),
    getFormatter(),
  ]);
  const tr = await getTranslations('Settings.regions');
  const now = new Date();
  const result = typeof bnet === 'string' && (RESULTS as readonly string[]).includes(bnet) ? (bnet as Result) : null;
  const success = result === 'connected' || result === 'connected_partial';
  const configured = isBattlenetConfigured();
  const connections = data?.connections ?? [];
  const characters = data?.characters ?? [];
  const preferredRegion = (profile?.preferredGameRegion as BattlenetRegion | null) ?? connections[0]?.region ?? 'us';

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-3xl">
        <h1 className="text-4xl text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </header>

      {result && (
        <div
          role="status"
          className={cn(
            'rounded-sm border px-4 py-3 text-sm',
            success ? 'border-success/40 bg-success/10 text-success' : 'border-danger/40 bg-danger/10 text-danger',
          )}
        >
          {t(`results.${result}`)}
        </div>
      )}

      <Panel title="Battle.net" titleId="bnet" className="corner-brackets">
        {!configured ? (
          <StateNotice state="not_available" title={t('notConfigured')} />
        ) : (
          <div className="flex flex-col gap-5">
            {connections.length > 0 && (
              <ul className="grid gap-3 xl:grid-cols-2">
                {connections.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-background/50 p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-foreground">
                        {tr(c.region)} ·{' '}
                        {c.battletag ? t('connectedAs', { battletag: c.battletag }) : t('connectedNoTag')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.charactersSyncedAt && (
                          <DataStateBadge
                            state="ok"
                            label={t('lastSync', { when: format.relativeTime(new Date(c.charactersSyncedAt), now) })}
                          />
                        )}
                        {c.mountsSyncedAt ? (
                          <DataStateBadge state="ok" label={t('mountsCount', { count: data?.collectedMounts ?? 0 })} />
                        ) : (
                          <DataStateBadge state="unknown" label={t('mountsUnknown')} />
                        )}
                      </div>
                    </div>
                    <DisconnectForm region={c.region} />
                  </li>
                ))}
              </ul>
            )}
            <p className="max-w-3xl text-sm text-muted-foreground">{t('consent')}</p>
            <ConnectForm defaultRegion={preferredRegion} connected={connections.length > 0} />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield aria-hidden className="size-3.5" />
              {t('retention')} {t('attribution')}
            </p>
          </div>
        )}
      </Panel>

      {characters.length === 0 ? (
        <StateNotice state="empty" title={t('empty')} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} regionLabel={tr(c.region)} />
          ))}
        </ul>
      )}
    </div>
  );
}

async function CharacterCard({ character: c, regionLabel }: { character: CharacterView; regionLabel: string }) {
  const t = await getTranslations('Characters');
  const factionTone =
    c.faction === 'ALLIANCE' ? 'border-l-[#3a7bd5]' : c.faction === 'HORDE' ? 'border-l-[#c4302b]' : 'border-l-border';
  return (
    <li className={cn('frame flex flex-col gap-1 border-l-4 p-4', factionTone)}>
      <p className="text-lg font-bold text-foreground">{c.name}</p>
      <p className="text-sm text-muted-foreground">
        {[c.level ? t('level', { level: c.level }) : null, c.raceName, c.className].filter(Boolean).join(' · ')}
      </p>
      <p className="text-xs text-muted-foreground">
        {c.realmName ?? c.realmSlug} · {regionLabel}
      </p>
      <span className="mt-2 self-start">
        <DataStateBadge state="ok" label={t(`source.${c.source}`)} />
      </span>
    </li>
  );
}
