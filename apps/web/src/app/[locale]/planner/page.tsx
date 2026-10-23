import {
  BATTLENET_REGIONS,
  RESET_SCHEDULE,
  SESSION_LENGTHS,
  planSession,
  type BattlenetRegion,
  type PlanCandidate,
} from '@wowhelp/shared';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { Container } from '@/components/ui/container';
import { StateNotice } from '@/components/ui/data-state';
import { Panel } from '@/components/ui/panel';
import { getCurrentUser } from '@/features/auth/session';
import { LocalTime } from '@/features/planner/local-time';
import { PlanList, TaskComposer, TaskList, type PlanItemView } from '@/features/planner/planner-ui';
import { getPlannerData } from '@/features/planner/queries';
import { getMyProfile } from '@/features/profile/queries';
import { Link, redirect } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Planner');
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function PlannerPage({ searchParams }: PageProps<'/[locale]/planner'>) {
  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AccountSidebar />
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<div className="frame h-64 animate-pulse" aria-hidden />}>
          <Planner searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

async function Planner({ searchParams }: { searchParams: PageProps<'/[locale]/planner'>['searchParams'] }) {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login?next=/planner', locale });

  const [{ m }, profile, t, tr] = await Promise.all([
    searchParams,
    getMyProfile(),
    getTranslations('Planner'),
    getTranslations('Settings.regions'),
  ]);
  const region: BattlenetRegion = (BATTLENET_REGIONS as readonly string[]).includes(profile?.preferredGameRegion ?? '')
    ? (profile!.preferredGameRegion as BattlenetRegion)
    : 'us';
  const minutes = SESSION_LENGTHS.find((l) => String(l) === m) ?? 30;
  const now = new Date();
  const data = await getPlannerData(region, now);
  if (!data) return <StateNotice state="sync_failed" title={t('errors.unknown')} />;

  const candidates: PlanCandidate[] = [
    ...data.tasks
      .filter((task) => task.active && !task.doneThisCycle)
      .map((task) => ({
        id: task.id,
        kind: 'task' as const,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        endsAt: new Date(task.cycleEndsAt),
      })),
    ...data.steps.map((step) => ({
      id: step.id,
      kind: 'step' as const,
      title: step.label,
      context: t('fromGoal', { goal: step.goalTitle }),
      estimatedMinutes: step.estimatedMinutes,
      priority: step.goalPriority,
    })),
  ];
  const plan = planSession(minutes, candidates);
  const cadenceOf = new Map(data.tasks.map((task) => [task.id, task.cadence]));
  const toView = (c: PlanCandidate): PlanItemView => ({
    id: c.id,
    kind: c.kind,
    title: c.title,
    context: c.context,
    minutes: c.estimatedMinutes,
    cadence: cadenceOf.get(c.id),
  });
  const schedule = RESET_SCHEDULE[region];

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-3xl">
        <h1 className="text-4xl text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title={t('sessionTitle')} titleId="session" className="corner-brackets">
          <div className="flex flex-col gap-4">
            <div role="group" aria-label={t('sessionLabel')} className="flex flex-wrap gap-2">
              {SESSION_LENGTHS.map((len) => (
                <Link
                  key={len}
                  href={`/planner?m=${len}`}
                  aria-current={len === minutes ? 'true' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-sm border px-4 font-semibold transition-colors',
                    len === minutes
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:border-primary/70',
                  )}
                >
                  {len === 120 ? '120+ min' : t('minutes', { minutes: len })}
                </Link>
              ))}
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('plan', { count: plan.items.length, minutes: plan.plannedMinutes })}
            </p>
            {plan.items.length > 0 ? (
              <PlanList items={plan.items.map(toView)} />
            ) : (
              <StateNotice state="empty" title={t('planEmpty')} />
            )}
            {plan.leftover.length > 0 && (
              <p className="text-xs text-muted-foreground">{t('leftover', { count: plan.leftover.length })}</p>
            )}
            {plan.unestimated.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground">{t('unestimated')}</p>
                <ul className="text-sm text-muted-foreground">
                  {plan.unestimated.map((c) => (
                    <li key={c.id}>{c.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>

        <Panel title={t('resetTitle')} titleId="resets">
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('weeklyReset')}</dt>
              <dd className="text-lg font-semibold text-foreground">
                <LocalTime iso={data.weekly.endsAt.toISOString()} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('dailyReset')}</dt>
              <dd className="text-lg font-semibold text-foreground">
                <LocalTime iso={data.daily.endsAt.toISOString()} />
              </dd>
            </div>
          </dl>
          <p className={cn('mt-3 text-xs', schedule.weeklyStatus === 'official' ? 'text-success' : 'text-warning')}>
            {schedule.weeklyStatus === 'official' ? t('resetOfficial') : t('resetEstimated')}{' '}
            <a href={schedule.source} target="_blank" rel="noopener noreferrer" className="underline">
              {t('resetSource')}
            </a>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('regionHint', { region: tr(region) })}</p>
        </Panel>
      </div>

      <Panel title={t('tasksTitle')} titleId="tasks">
        <div className="flex flex-col gap-4">
          <p className="max-w-3xl text-sm text-muted-foreground">{t('tasksIntro')}</p>
          <TaskComposer />
          <TaskList tasks={data.tasks} />
        </div>
      </Panel>
    </div>
  );
}
