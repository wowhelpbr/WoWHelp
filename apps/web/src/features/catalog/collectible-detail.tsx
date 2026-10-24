import { mountStatusFor, type Locale } from '@wowhelp/shared';
import { Check, CircleSlash, MousePointer2, Plus, X } from 'lucide-react';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/button';
import { StateNotice } from '@/components/ui/data-state';
import { getCurrentUser } from '@/features/auth/session';
import { getMyEncounterAttempts } from '@/features/battlenet/attempts';
import { getPublishedGuide } from '@/features/guides/queries';
import { Link } from '@/i18n/navigation';
import { LOCALE_PREFIX } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/server';
import { createCollectibleGoalAction, setCollectionManualAction } from './actions';
import { CATALOG_PATH, IMAGE_MODE, type CatalogKind } from './kinds';
import { getCatalog, getMyCollectionData } from './queries';
import { MountStatusChip } from './status-badge';
import { TiltStage } from './tilt-stage';

/** Esta conta já transformou o item em objetivo? */
async function hasGoalFor(collectibleId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from('goals').select('id').eq('collectible_id', collectibleId).limit(1);
  return Boolean(data?.length);
}

/**
 * Detalhes de um colecionável (montaria, mascote ou brinquedo): usado na
 * página própria (/mounts/6) e na janela que abre por cima do catálogo. Só
 * mostra dado que existe: o que ainda não tem fonte revisada (chance de drop,
 * local) aparece como desconhecido.
 */
export async function CollectibleDetail({
  kind,
  externalId,
  titleId,
}: {
  kind: CatalogKind;
  externalId: string;
  titleId: string;
}) {
  const locale = (await getLocale()) as Locale;
  const [result, user, t, tk, format] = await Promise.all([
    getCatalog(kind, locale),
    getCurrentUser(),
    getTranslations('Mounts'),
    getTranslations(`Catalog.${kind}`),
    getFormatter(),
  ]);
  const path = CATALOG_PATH[kind];
  const item =
    result.status === 'ok' && /^\d{1,20}$/.test(externalId)
      ? result.items.find((m) => m.externalId === externalId)
      : undefined;

  if (!item) {
    return (
      <div className="flex flex-col gap-4">
        <div id={titleId}>
          <StateNotice state="empty" title={tk('notFound')} />
        </div>
        <Link href={path} className={buttonClasses('secondary', 'sm', 'self-start')}>
          {tk('back')}
        </Link>
      </div>
    );
  }

  const [mine, guide, chosen] = await Promise.all([
    user ? getMyCollectionData(kind) : null,
    getPublishedGuide(kind, item.externalId, locale),
    user ? hasGoalFor(item.id) : false,
  ]);
  const attempts =
    user && guide?.encounterId ? await getMyEncounterAttempts(guide.encounterId, guide.encounterDifficulty) : null;
  const status = mine
    ? mountStatusFor(item.externalId, mine.observations, {
        syncedAt: mine.accountSyncedAt,
        addonObservedAt: mine.addonObservedAt,
        now: new Date(),
      })
    : null;
  const manual = mine?.observations.find((o) => o.externalItemId === item.externalId && o.source === 'manual');
  const back = `${LOCALE_PREFIX[locale]}${path}/${item.externalId}`;
  const got = status?.status === 'collected';
  const trying = got || (attempts?.total ?? 0) > 0;
  const howLines = guide?.how
    ? guide.how
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <article aria-labelledby={titleId} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      <div className="relative">
        <TiltStage
          imageUrl={item.imageUrl}
          imageMode={IMAGE_MODE[kind]}
          placeholder={kind}
          className="lg:aspect-square"
        />
        <span className="chip pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 bg-black/50 md:inline-flex">
          <MousePointer2 aria-hidden className="size-3" />
          {t('hoverHint')}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {status && <MountStatusChip status={status.status} />}
            {item.categoryName && <span className="chip">{item.categoryName}</span>}
            <span className="chip">{item.sourceName ?? t('sourceUnknown')}</span>
            {item.faction && (
              <span className="chip chip-cyan">{t('factionOnly', { faction: t(`factions.${item.faction}`) })}</span>
            )}
          </div>
          <h1 id={titleId} className="text-4xl text-foreground sm:text-5xl">
            {item.name}
          </h1>
          {item.summary && <p className="max-w-prose text-muted-foreground sm:text-lg">{item.summary}</p>}
        </header>

        {/* Números da proposta: chance de drop, suas tentativas (ciano) e onde. */}
        <div className={cn('grid gap-2', guide?.encounterId ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          <dl className="rounded-lg bg-sidebar p-4">
            <dt className="label">{t('dropChance')}</dt>
            {guide?.dropChancePercent ? (
              <dd className="mt-2 flex flex-col gap-1">
                <span className="font-display text-2xl leading-none font-bold tabular-nums">
                  {format.number(guide.dropChancePercent / 100, { style: 'percent', maximumFractionDigits: 3 })}
                </span>
                {guide.chanceNote && <span className="text-xs text-muted-foreground">{guide.chanceNote}</span>}
              </dd>
            ) : (
              <dd className="mt-2 text-sm text-muted-foreground">{t('dropChanceUnknown')}</dd>
            )}
          </dl>

          {guide?.encounterId && (
            <section
              aria-labelledby={`${titleId}-attempts`}
              className={cn(
                'flex flex-col gap-2 rounded-lg p-4',
                attempts?.connected ? 'glow-cyan bg-neon text-primary-foreground' : 'bg-sidebar',
              )}
            >
              <h2
                id={`${titleId}-attempts`}
                className={cn('label', attempts?.connected && 'text-primary-foreground/75')}
              >
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
                  <p className="flex flex-col gap-1">
                    <span className="font-display text-2xl leading-none font-bold tabular-nums">{attempts.total}</span>
                    <span className="text-xs font-semibold">
                      {t('attemptsKills', {
                        count: attempts.total,
                        characters: attempts.characters.length,
                        difficulty: guide.encounterDifficulty ?? 'any',
                      })}
                    </span>
                  </p>
                  {attempts.characters.length > 0 && (
                    <ul className="flex flex-col gap-0.5 text-xs">
                      {attempts.characters.slice(0, 6).map((c) => (
                        <li key={`${c.name}-${c.realm}`} className="flex justify-between gap-3">
                          <span>
                            {c.name}
                            {c.realm && <span className="opacity-70"> · {c.realm}</span>}
                          </span>
                          <span className="tabular-nums">{c.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          )}

          <dl className="rounded-lg bg-sidebar p-4">
            <dt className="label">{t('where')}</dt>
            <dd className={cn('mt-2 text-sm', guide?.location ? 'text-foreground' : 'text-muted-foreground')}>
              {guide?.location ?? t('whereUnknown')}
            </dd>
          </dl>
        </div>

        {user && (
          <ol aria-label={t('journeyLabel')} className="steps cyan">
            <li className={chosen || trying ? 'on' : undefined}>{t('stepChosen')}</li>
            <li className={trying ? 'on' : undefined}>{t('stepTrying')}</li>
            <li className={got ? 'on' : undefined}>{t('stepGot')}</li>
          </ol>
        )}

        <section aria-labelledby={`${titleId}-how`} className="flex flex-col gap-2">
          <h2 id={`${titleId}-how`} className="label">
            {t('howToGet')}
          </h2>
          <ol className="flex flex-col gap-1.5">
            {(howLines.length ? howLines : [item.sourceName ?? t('sourceUnknown')]).map((line, i) => (
              <li
                key={i}
                className={cn(
                  'grid grid-cols-[1.75rem_1fr] items-start gap-3 rounded-md px-3.5 py-3 text-sm font-semibold',
                  howLines.length
                    ? 'bg-primary text-primary-foreground shadow-[0_0_14px_rgb(197_251_20/0.25)]'
                    : 'bg-sidebar text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-7 place-items-center rounded font-display text-xs font-bold',
                    howLines.length ? 'bg-black/15' : 'bg-card-raised text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span className="pt-1">{line}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <form action={createCollectibleGoalAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="collectibleId" value={item.id} />
              <input type="hidden" name="back" value={back} />
              <button type="submit" className={buttonClasses('primary', 'md', undefined, 'cut')}>
                <Plus aria-hidden className="size-4" />
                {t('createGoal')}
              </button>
            </form>
            {user && (
              <>
                <form action={setCollectionManualAction}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="externalId" value={item.externalId} />
                  <input type="hidden" name="status" value="collected" />
                  <button type="submit" className={buttonClasses('secondary', 'md')}>
                    <Check aria-hidden className="size-4" />
                    {t('markCollected')}
                  </button>
                </form>
                <form action={setCollectionManualAction}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="externalId" value={item.externalId} />
                  <input type="hidden" name="status" value="not_collected" />
                  <button type="submit" className={buttonClasses('ghost', 'md')}>
                    <CircleSlash aria-hidden className="size-4" />
                    {t('markNotCollected')}
                  </button>
                </form>
                {manual && (
                  <form action={setCollectionManualAction}>
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="externalId" value={item.externalId} />
                    <input type="hidden" name="status" value="clear" />
                    <button type="submit" className={buttonClasses('ghost', 'md')}>
                      <X aria-hidden className="size-4" />
                      {t('clearManual')}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {user
              ? status?.source
                ? t(`statusHelp.${status.source}`)
                : t('statusHelp.unknown')
              : t('signInForStatus')}
          </p>
        </div>

        <div className="flex flex-col gap-1 text-xs text-faint">
          {guide && (guide.sourceUrl || guide.reviewedAt) && (
            <p className="flex items-center gap-1.5">
              <Check aria-hidden className="size-3.5 shrink-0 text-neon" />
              <span>
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
              </span>
            </p>
          )}
          {attempts?.connected && (
            <p>
              {attempts.fetchedAt
                ? t('attemptsSource', { when: format.relativeTime(new Date(attempts.fetchedAt), new Date()) })
                : t('attemptsNone')}
            </p>
          )}
          <p>
            {tk('attribution')} {tk('blizzardId', { id: item.externalId })}
            {item.fetchedAt
              ? ` · ${t('updated', { when: format.relativeTime(new Date(item.fetchedAt), new Date()) })}`
              : ''}
          </p>
        </div>
      </div>
    </article>
  );
}
