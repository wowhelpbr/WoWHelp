import { getFreshness, goalProgress, nextOpenStep, pickNextActions } from '@wowhelp/shared';
import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { Panel } from '@/components/ui/panel';
import { getMyAddonImports } from '@/features/addon/queries';
import { getCurrentUser } from '@/features/auth/session';
import { getMyBattlenetData } from '@/features/battlenet/queries';
import { GoalComposer } from '@/features/goals/goal-composer';
import { GoalList } from '@/features/goals/goal-list';
import { getMyGoals } from '@/features/goals/queries';
import { FocusEditor } from '@/features/onboarding/focus-editor';
import { getMyProfile } from '@/features/profile/queries';
import { Link, redirect } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function DashboardPage() {
  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AccountSidebar />
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </Container>
    </div>
  );
}

/** Lê a sessão: fica atrás do Suspense. O proxy já barra visitantes; aqui é a checagem real. */
async function Dashboard() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login?next=/dashboard', locale });

  const [goalsResult, profile, bnet, addonImports, t, tg, format] = await Promise.all([
    getMyGoals(),
    getMyProfile(),
    getMyBattlenetData(),
    getMyAddonImports(),
    getTranslations('Dashboard'),
    getTranslations('Goals'),
    getFormatter(),
  ]);
  const now = new Date();
  const lastAddonImport = addonImports?.[0]?.importedAt ?? null;
  const characters = bnet?.characters ?? [];
  const lastBattlenetSync =
    bnet?.connections
      .map((c) => c.charactersSyncedAt)
      .filter((d): d is string => d !== null)
      .sort()
      .at(-1) ?? null;
  // Mais de 7 dias sem sincronizar: avisa como "desatualizado" (apagado aos 30).
  const freshness = getFreshness(lastBattlenetSync, now, 24 * 7);

  const goals = goalsResult.status === 'ok' ? goalsResult.goals : [];
  const nextActions = pickNextActions(goals);
  const stats = [
    { key: 'statActive', value: goals.filter((g) => g.status === 'active').length },
    { key: 'statSteps', value: goals.reduce((sum, g) => sum + goalProgress(g.steps).done, 0) },
    { key: 'statCompleted', value: goals.filter((g) => g.status === 'completed').length },
  ] as const;
  const lastManualUpdate = goals.reduce<string | null>(
    (latest, g) => (latest === null || Date.parse(g.updatedAt) > Date.parse(latest) ? g.updatedAt : latest),
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl text-foreground">{t('greeting')}</h1>
          {user!.email && (
            <p className="mt-1 text-sm text-muted-foreground">{t('signedInAs', { email: user!.email })}</p>
          )}
        </div>
        {/* Blocos de números do HUD: só contagens reais dos objetivos do jogador. */}
        <dl aria-label={t('statsLabel')} className="grid grid-cols-3 gap-2 xl:w-[26rem]">
          {stats.map((stat) => (
            <div key={stat.key} className="frame flex flex-col-reverse px-3 py-2.5">
              <dt className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
                {t(stat.key)}
              </dt>
              <dd className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel title={t('nextActionsTitle')} titleId="next-actions" className="corner-brackets">
            {nextActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('nextActionsEmpty')}</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {nextActions.map((goal) => {
                  const step = nextOpenStep(goal.steps);
                  const { done, total } = goalProgress(goal.steps);
                  return (
                    <li key={goal.id} className="flex items-start gap-3">
                      <span className="quest-mark mt-0.5" aria-hidden>
                        !
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-lg text-primary">{goal.title}</p>
                        <p className="text-sm text-foreground">
                          {step ? t('nextStep', { step: step.label }) : t('noOpenSteps')}
                        </p>
                        {total > 0 && (
                          <p className="text-xs text-muted-foreground">{tg('progress', { done, total })}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          <Panel title={tg('title')} titleId="goals">
            <div className="flex flex-col gap-5">
              <GoalComposer />
              {goalsResult.status === 'error' ? (
                <StateNotice state="sync_failed" title={tg('errors.unknown')} />
              ) : (
                <GoalList goals={goals} />
              )}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title={t('focusTitle')} titleId="focus">
            <FocusEditor areas={profile?.focusAreas ?? []} />
          </Panel>

          <Panel title={t('charactersTitle')} titleId="characters">
            {characters.length === 0 ? (
              <StateNotice
                state="empty"
                title={t('charactersEmpty')}
                action={
                  <ButtonLink href="/characters" variant="secondary" size="sm" className="self-start">
                    {t('charactersConnect')}
                  </ButtonLink>
                }
              />
            ) : (
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-2">
                  {characters.slice(0, 4).map((c) => (
                    <li key={c.id} className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <span className="text-muted-foreground">
                        {[c.level, c.className].filter(Boolean).join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
                {characters.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    {t('charactersMore', { count: characters.length - 4 })}
                  </p>
                )}
                <ButtonLink href="/characters" variant="ghost" size="sm" className="self-start">
                  {t('charactersSeeAll')}
                </ButtonLink>
              </div>
            )}
          </Panel>

          <Panel title={t('sourcesTitle')} titleId="sources">
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">{t('sourceManual')}</span>
                <DataStateBadge
                  state={lastManualUpdate ? 'ok' : 'empty'}
                  label={
                    lastManualUpdate
                      ? t('lastUpdated', { when: format.relativeTime(new Date(lastManualUpdate), now) })
                      : undefined
                  }
                />
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">{t('sourceBattlenet')}</span>
                {lastBattlenetSync ? (
                  <DataStateBadge
                    state={freshness === 'stale' ? 'stale' : 'ok'}
                    label={t('lastUpdated', { when: format.relativeTime(new Date(lastBattlenetSync), now) })}
                  />
                ) : (
                  <DataStateBadge state="empty" label={t('notConnected')} />
                )}
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <Link href="/import" className="text-foreground underline-offset-4 hover:text-primary hover:underline">
                  {t('sourceAddon')}
                </Link>
                {lastAddonImport ? (
                  <DataStateBadge
                    state="ok"
                    label={t('lastUpdated', { when: format.relativeTime(new Date(lastAddonImport), now) })}
                  />
                ) : (
                  <DataStateBadge state="empty" label={t('addonNever')} />
                )}
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="h-10 w-64 rounded bg-white/5" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div className="frame h-40" />
          <div className="frame h-72" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="frame h-40" />
          <div className="frame h-32" />
        </div>
      </div>
    </div>
  );
}
