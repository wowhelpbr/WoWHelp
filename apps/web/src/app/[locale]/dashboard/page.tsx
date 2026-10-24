import {
  BATTLENET_REGIONS,
  currentCycle,
  getFreshness,
  goalProgress,
  nextOpenStep,
  pickNextActions,
  type BattlenetRegion,
} from '@wowhelp/shared';
import { CalendarCheck, ListChecks, Plus, Target, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { ButtonLink, buttonClasses } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { Panel } from '@/components/ui/panel';
import { getMyAddonImports } from '@/features/addon/queries';
import { getCurrentUser } from '@/features/auth/session';
import { classColor } from '@/features/battlenet/class-colors';
import { getMyBattlenetData } from '@/features/battlenet/queries';
import { GoalComposer } from '@/features/goals/goal-composer';
import { GoalList } from '@/features/goals/goal-list';
import { getMyGoals, type GoalView } from '@/features/goals/queries';
import { JourneyPanel } from '@/features/gamification/journey-panel';
import { FocusEditor } from '@/features/onboarding/focus-editor';
import { getPlannerData } from '@/features/planner/queries';
import { getMyProfile } from '@/features/profile/queries';
import { Link, redirect } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function DashboardPage() {
  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AccountSidebar>
        <Suspense fallback={null}>
          <PinnedGoals />
        </Suspense>
      </AccountSidebar>
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </Container>
    </div>
  );
}

/** Situação de cada objetivo na tabela de próximas ações (etiqueta da proposta). */
function rowStatus(goal: GoalView): { key: 'rowInProgress' | 'rowStarted' | 'rowDraft' | 'rowPaused'; chip: string } {
  if (goal.status === 'paused') return { key: 'rowPaused', chip: 'chip chip-grey' };
  const { done, total } = goalProgress(goal.steps);
  if (total === 0) return { key: 'rowDraft', chip: 'chip chip-grey' };
  if (done === 0) return { key: 'rowStarted', chip: 'chip chip-purple' };
  return { key: 'rowInProgress', chip: 'chip chip-lime' };
}

/** Objetivos ativos no menu lateral (os de maior prioridade). */
async function PinnedGoals() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [result, t] = await Promise.all([getMyGoals(), getTranslations('Dashboard')]);
  const active = result.status === 'ok' ? pickNextActions(result.goals).slice(0, 3) : [];
  if (active.length === 0) return null;
  return (
    <section aria-labelledby="pinned-title" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1.5">
        <h2 id="pinned-title" className="label">
          {t('pinnedTitle')}
        </h2>
        <span className="min-w-5 rounded-[3px] bg-neon px-1.5 text-center font-display text-[0.625rem] leading-[18px] font-bold text-primary-foreground">
          {active.length}
        </span>
      </div>
      {active.map((goal) => {
        const { done, total } = goalProgress(goal.steps);
        return (
          <div key={goal.id} className="grid grid-cols-[2rem_1fr] items-center gap-2.5 rounded-md bg-card p-2">
            <span className="stat-icon size-8!">
              <Target aria-hidden className="size-4" />
            </span>
            <span className="min-w-0">
              <b className="block truncate font-display text-[0.6875rem] font-bold tracking-[0.02em] text-foreground uppercase">
                {goal.title}
              </b>
              <span className="text-xs text-faint">
                {total ? t('pinnedSteps', { done, total }) : t('pinnedNoSteps')}
              </span>
            </span>
          </div>
        );
      })}
    </section>
  );
}

/** Lê a sessão: fica atrás do Suspense. O proxy já barra visitantes; aqui é a checagem real. */
async function Dashboard() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login?next=/dashboard', locale });

  const profile = await getMyProfile();
  const region: BattlenetRegion = (BATTLENET_REGIONS as readonly string[]).includes(profile?.preferredGameRegion ?? '')
    ? (profile!.preferredGameRegion as BattlenetRegion)
    : 'us';
  const now = new Date();
  const [goalsResult, bnet, addonImports, planner, t, tg, format] = await Promise.all([
    getMyGoals(),
    getMyBattlenetData(),
    getMyAddonImports(),
    getPlannerData(region, now),
    getTranslations('Dashboard'),
    getTranslations('Goals'),
    getFormatter(),
  ]);
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
  const weekly = (planner?.tasks ?? []).filter((task) => task.active && task.cadence === 'weekly');
  const weeklyDone = weekly.filter((task) => task.doneThisCycle).length;
  const resetDay = format.dateTime(currentCycle(region, 'weekly', now).endsAt, { weekday: 'long' });

  const stats = [
    { key: 'statActive', icon: Target, value: String(goals.filter((g) => g.status === 'active').length), hot: false },
    {
      key: 'statSteps',
      icon: ListChecks,
      value: String(goals.reduce((sum, g) => sum + goalProgress(g.steps).done, 0)),
      hot: false,
    },
    { key: 'statWeekly', icon: CalendarCheck, value: `${weeklyDone}/${weekly.length}`, hot: false },
    {
      key: 'statCompleted',
      icon: Trophy,
      value: String(goals.filter((g) => g.status === 'completed').length),
      hot: true,
    },
  ] as const;
  const lastManualUpdate = goals.reduce<string | null>(
    (latest, g) => (latest === null || Date.parse(g.updatedAt) > Date.parse(latest) ? g.updatedAt : latest),
    null,
  );

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{t('metaTitle')}</p>
          <h1 className="mt-3 text-4xl text-foreground sm:text-5xl">{t('greeting')}</h1>
          {user!.email && (
            <p className="mt-2 text-sm text-muted-foreground">{t('signedInAs', { email: user!.email })}</p>
          )}
        </div>
        <a href="#goals" className={buttonClasses('primary', 'md', undefined, 'cut')}>
          <Plus aria-hidden className="size-4" />
          {t('newGoal')}
        </a>
      </header>

      {/* Números reais dos objetivos e das semanais; os concluídos ganham o neon. */}
      <dl aria-label={t('statsLabel')} className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {stats.map(({ key, icon: Icon, value, hot }) => (
          // dl > div > dt + dd (o ícone fica dentro do dt, para a lista continuar válida).
          <div
            key={key}
            className={cn(
              'relative flex flex-col gap-1.5 rounded-lg py-4 pr-4 pl-17',
              hot ? 'glow-lime bg-primary text-primary-foreground' : 'border border-border-soft bg-sidebar',
            )}
          >
            <dt className={hot ? 'label text-primary-foreground/75' : 'label'}>
              <span
                className={
                  hot
                    ? 'absolute top-1/2 left-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/10'
                    : 'stat-icon absolute top-1/2 left-4 size-10! -translate-y-1/2'
                }
              >
                <Icon aria-hidden className="size-4.5" />
              </span>
              {t(key)}
            </dt>
            <dd className="font-display text-3xl leading-none font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <JourneyPanel />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="next-actions" className="flex flex-col gap-3">
            <h2 id="next-actions" className="text-2xl text-foreground">
              {t('nextActionsTitle')}
            </h2>
            {nextActions.length === 0 ? (
              <p className="rounded-lg bg-card p-4 text-sm text-muted-foreground">{t('nextActionsEmpty')}</p>
            ) : (
              <div className="flex flex-col gap-1.5" role="table" aria-labelledby="next-actions">
                <div role="row" className="hidden grid-cols-[2fr_1.6fr_1fr_1.3fr] items-center gap-3 px-4 md:grid">
                  {(['colGoal', 'colNext', 'colStatus', 'colProgress'] as const).map((k) => (
                    <span key={k} role="columnheader" className="label">
                      {t(k)}
                    </span>
                  ))}
                </div>
                {nextActions.map((goal) => {
                  const step = nextOpenStep(goal.steps);
                  const { done, total } = goalProgress(goal.steps);
                  const status = rowStatus(goal);
                  const segments = Math.min(Math.max(total, 1), 5);
                  const filled = total ? Math.round((done / total) * segments) : 0;
                  return (
                    <div
                      key={goal.id}
                      role="row"
                      className="grid min-h-15 grid-cols-1 items-center gap-2 rounded-md bg-card px-4 py-3 transition-colors hover:bg-card-raised md:grid-cols-[2fr_1.6fr_1fr_1.3fr] md:gap-3"
                    >
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <span className="stat-icon size-9!">
                          <Target aria-hidden className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <b className="block truncate font-display text-[0.8125rem] font-bold text-foreground">
                            {goal.title}
                          </b>
                          {total > 0 && <span className="text-xs text-faint">{tg('progress', { done, total })}</span>}
                        </span>
                      </span>
                      <span role="cell" className="text-sm text-muted-foreground">
                        {step ? t('nextStep', { step: step.label }) : t('noOpenSteps')}
                      </span>
                      <span role="cell">
                        <span className={status.chip}>{t(status.key)}</span>
                      </span>
                      <span role="cell" aria-label={tg('progress', { done, total })}>
                        <span className={cn('steps', status.key === 'rowInProgress' ? 'lime' : undefined)} aria-hidden>
                          {Array.from({ length: segments }, (_, i) => (
                            <span key={i} className={i < filled ? 'on' : undefined}>
                              {i + 1}
                            </span>
                          ))}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <Panel title={tg('title')} titleId="goals">
            <div className="flex scroll-mt-24 flex-col gap-5">
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
          <Panel
            title={t('weekTitle')}
            titleId="week"
            actions={<span className="chip">{t('weekResets', { day: resetDay })}</span>}
          >
            {weekly.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">{t('weekEmpty')}</p>
                <ButtonLink href="/planner" variant="secondary" size="sm">
                  {t('weekOpenPlanner')}
                </ButtonLink>
              </div>
            ) : (
              <ol className="relative flex flex-col gap-3.5 pl-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-1.5 before:border-l-2 before:border-dashed before:border-chip">
                {weekly.map((task) => (
                  <li
                    key={task.id}
                    className={cn(
                      'relative flex justify-between gap-3 text-sm',
                      'before:absolute before:top-1.5 before:-left-[1.4rem] before:size-3 before:rounded-full',
                      task.doneThisCycle
                        ? 'text-foreground before:bg-primary before:shadow-[0_0_14px_rgb(197_251_20/0.6)]'
                        : 'text-muted-foreground before:bg-chip',
                    )}
                  >
                    {task.title}
                    <span className="label">{task.doneThisCycle ? t('weekDone') : t('weekPending')}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel
            title={t('charactersTitle')}
            titleId="characters"
            actions={characters.length > 0 ? <span className="chip chip-cyan">{t('battlenetOk')}</span> : undefined}
          >
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
              <div className="flex flex-col gap-2">
                <ul className="flex flex-col gap-1.5">
                  {characters.slice(0, 4).map((c) => (
                    <li
                      key={c.id}
                      className="grid grid-cols-[0.5rem_1fr_auto] items-center gap-3 rounded-md bg-sidebar px-3 py-2.5"
                    >
                      <span
                        aria-hidden
                        className="h-8 w-2 rounded-[2px]"
                        style={{ backgroundColor: classColor(c.className) }}
                      />
                      <span className="min-w-0">
                        <b className="block truncate font-display text-[0.8125rem] font-bold text-foreground uppercase">
                          {c.name}
                        </b>
                        <span className="text-xs text-faint">
                          {[c.className, c.level ? t('levelValue', { level: c.level }) : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <span className="label">{c.realmName ?? c.realmSlug}</span>
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

          <Panel title={t('focusTitle')} titleId="focus">
            <FocusEditor areas={profile?.focusAreas ?? []} />
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
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-sidebar" />
        ))}
      </div>
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
