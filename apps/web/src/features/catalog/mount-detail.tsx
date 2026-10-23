import { mountStatusFor, type Locale } from '@wowhelp/shared';
import { Check, CircleSlash, Percent, Swords, Target, X } from 'lucide-react';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/button';
import { DataStateBadge, StateNotice } from '@/components/ui/data-state';
import { getCurrentUser } from '@/features/auth/session';
import { getMyEncounterAttempts } from '@/features/battlenet/attempts';
import { getPublishedGuide } from '@/features/guides/queries';
import { Link } from '@/i18n/navigation';
import { LOCALE_PREFIX } from '@/i18n/routing';
import { createMountGoalAction, setMountManualAction } from './actions';
import { getCatalogMounts, getMyMountData } from './queries';
import { MountStatusBadge } from './status-badge';
import { TiltStage } from './tilt-stage';

/**
 * Detalhes de uma montaria: usado na página própria (/mounts/6) e na janela
 * que abre por cima do catálogo. Só mostra dado que existe: o que ainda não
 * tem fonte revisada (chance de drop, local) aparece como desconhecido.
 */
export async function MountDetail({ externalId, titleId }: { externalId: string; titleId: string }) {
  const locale = (await getLocale()) as Locale;
  const [result, user, t, format] = await Promise.all([
    getCatalogMounts(locale),
    getCurrentUser(),
    getTranslations('Mounts'),
    getFormatter(),
  ]);
  const mount =
    result.status === 'ok' && /^\d{1,20}$/.test(externalId)
      ? result.mounts.find((m) => m.externalId === externalId)
      : undefined;

  if (!mount) {
    return (
      <div className="flex flex-col gap-4">
        <div id={titleId}>
          <StateNotice state="empty" title={t('notFound')} />
        </div>
        <Link href="/mounts" className={buttonClasses('secondary', 'sm', 'self-start')}>
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const [mine, guide] = await Promise.all([
    user ? getMyMountData() : null,
    getPublishedGuide('mount', mount.externalId, locale),
  ]);
  const attempts =
    user && guide?.encounterId ? await getMyEncounterAttempts(guide.encounterId, guide.encounterDifficulty) : null;
  const status = mine
    ? mountStatusFor(mount.externalId, mine.observations, {
        syncedAt: mine.accountSyncedAt,
        addonObservedAt: mine.addonObservedAt,
        now: new Date(),
      })
    : null;
  const manual = mine?.observations.find((o) => o.externalItemId === mount.externalId && o.source === 'manual');
  const back = `${LOCALE_PREFIX[locale]}/mounts/${mount.externalId}`;

  return (
    <article aria-labelledby={titleId} className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
      <TiltStage imageUrl={mount.imageUrl} />

      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-3">
          <p className="eyebrow">{mount.sourceName ?? t('sourceUnknown')}</p>
          <h1 id={titleId} className="text-4xl text-foreground sm:text-5xl">
            {mount.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            {status && <MountStatusBadge status={status.status} />}
            {mount.faction && (
              <DataStateBadge state="ok" label={t('factionOnly', { faction: t(`factions.${mount.faction}`) })} />
            )}
          </div>
        </header>

        {mount.summary && <p className="max-w-prose text-lg text-foreground">{mount.summary}</p>}

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="frame p-4">
            <dt className="eyebrow">{t('dropChance')}</dt>
            {guide?.dropChancePercent ? (
              <dd className="mt-1.5 flex flex-col gap-1">
                <span className="font-display text-3xl text-primary tabular-nums">
                  {format.number(guide.dropChancePercent / 100, { style: 'percent', maximumFractionDigits: 3 })}
                </span>
                {guide.chanceNote && <span className="text-sm text-foreground">{guide.chanceNote}</span>}
              </dd>
            ) : (
              <dd className="mt-1.5 flex items-center gap-2 text-muted-foreground">
                <Percent aria-hidden className="size-4 shrink-0" />
                {t('dropChanceUnknown')}
              </dd>
            )}
          </div>
          <div className="frame p-4">
            <dt className="eyebrow">{t('where')}</dt>
            <dd className={guide?.location ? 'mt-1.5 text-foreground' : 'mt-1.5 text-muted-foreground'}>
              {guide?.location ?? t('whereUnknown')}
            </dd>
          </div>
          <div className="frame p-4 sm:col-span-2">
            <dt className="eyebrow">{t('howToGet')}</dt>
            {guide?.how ? (
              <dd className="mt-1.5 flex flex-col gap-2 text-foreground">
                {guide.how
                  .split(/\n+/)
                  .filter((line) => line.trim())
                  .map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
              </dd>
            ) : (
              <dd className="mt-1.5 text-foreground">{mount.sourceName ?? t('sourceUnknown')}</dd>
            )}
          </div>
        </dl>

        {guide && (guide.sourceUrl || guide.reviewedAt) && (
          <p className="text-xs text-muted-foreground">
            {guide.sourceUrl && (
              <>
                {t('sourcePrefix')}{' '}
                <a
                  href={guide.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-neon underline underline-offset-2"
                >
                  {guide.sourceLabel ?? new URL(guide.sourceUrl).hostname}
                </a>
                {guide.reviewedAt ? ' · ' : ''}
              </>
            )}
            {guide.reviewedAt &&
              t('reviewedOn', { date: format.dateTime(new Date(guide.reviewedAt), { dateStyle: 'medium' }) })}
          </p>
        )}

        {guide?.encounterId && (
          <section aria-labelledby={`${titleId}-attempts`} className="frame corner-brackets flex flex-col gap-3 p-4">
            <h2 id={`${titleId}-attempts`} className="eyebrow">
              {t('attemptsTitle')}
            </h2>
            {!user ? (
              <p className="text-sm text-muted-foreground">{t('attemptsSignIn')}</p>
            ) : !attempts?.connected ? (
              <p className="text-sm text-muted-foreground">
                {t('attemptsConnect')}{' '}
                <Link href="/characters" className="text-neon underline underline-offset-2">
                  {t('attemptsConnectLink')}
                </Link>
              </p>
            ) : (
              <>
                <p className="flex items-baseline gap-2">
                  <Swords aria-hidden className="size-5 shrink-0 self-center text-primary" />
                  <span className="font-display text-3xl text-primary tabular-nums">{attempts.total}</span>
                  <span className="text-foreground">
                    {t('attemptsKills', {
                      count: attempts.total,
                      characters: attempts.characters.length,
                      difficulty: guide.encounterDifficulty ?? 'any',
                    })}
                  </span>
                </p>
                {attempts.characters.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {attempts.characters.slice(0, 6).map((c) => (
                      <li key={`${c.name}-${c.realm}`} className="flex justify-between gap-3">
                        <span className="text-foreground">
                          {c.name}
                          {c.realm && <span className="text-muted-foreground"> · {c.realm}</span>}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  {attempts.fetchedAt
                    ? t('attemptsSource', {
                        when: format.relativeTime(new Date(attempts.fetchedAt), new Date()),
                      })
                    : t('attemptsNone')}
                </p>
              </>
            )}
          </section>
        )}

        <div className="frame-raised flex flex-col gap-4 p-4">
          <form action={createMountGoalAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="collectibleId" value={mount.id} />
            <input type="hidden" name="back" value={back} />
            <button type="submit" className={buttonClasses('primary', 'md', 'w-full sm:w-auto')}>
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
        </div>

        <p className="text-xs text-muted-foreground">
          {t('attribution')} {t('blizzardId', { id: mount.externalId })}
          {mount.fetchedAt
            ? ` · ${t('updated', { when: format.relativeTime(new Date(mount.fetchedAt), new Date()) })}`
            : ''}
        </p>
      </div>
    </article>
  );
}
