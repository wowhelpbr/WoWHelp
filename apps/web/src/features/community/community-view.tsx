import { CREATOR_PLATFORMS, CREATOR_TAGS, type CreatorPlatform, type CreatorTag, type Locale } from '@wowhelp/shared';
import { ExternalLink, Search, Sparkles } from 'lucide-react';
import { connection } from 'next/server';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/button';
import { StateNotice } from '@/components/ui/data-state';
import { AdSlot } from '@/features/ads/ads';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { CreatorAvatar, LatestCard, LiveCard, PLATFORM_TEXT } from './live-card';
import { liveTracking } from './live-config';
import { getPublishedCreators, type ChannelView, type CreatorView } from './queries';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const ONE_WEEK = 7 * 86_400_000;

function readParams(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const tag = (CREATOR_TAGS as readonly string[]).includes(one('tag')) ? (one('tag') as CreatorTag) : null;
  const platform = (CREATOR_PLATFORMS as readonly string[]).includes(one('platform'))
    ? (one('platform') as CreatorPlatform)
    : null;
  const q = one('q').trim().slice(0, 60);
  return { tag, platform, q };
}

function communityHref(params: { tag: string | null; platform: string | null; q: string }) {
  const p = new URLSearchParams();
  if (params.platform) p.set('platform', params.platform);
  if (params.tag) p.set('tag', params.tag);
  if (params.q) p.set('q', params.q);
  const s = p.toString();
  return s ? `/community?${s}` : '/community';
}

async function PlatformLink({ channel }: { channel: ChannelView }) {
  const t = await getTranslations('Community');
  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 font-sans text-xs font-extrabold hover:brightness-125',
        PLATFORM_TEXT[channel.platform],
      )}
    >
      {t(`platforms.${channel.platform}`)}
      <ExternalLink aria-hidden className="size-3" />
      <span className="sr-only">{t('opensNewTab')}</span>
    </a>
  );
}

/** Filtro de plataforma do herói (Todos / Twitch / YouTube / Kick), em roxo. */
export async function PlatformFilter({ searchParams }: { searchParams: SearchParams }) {
  const [sp, t] = await Promise.all([searchParams, getTranslations('Community')]);
  const { tag, platform, q } = readParams(sp);
  const options: (CreatorPlatform | null)[] = [null, ...CREATOR_PLATFORMS];
  return (
    <nav aria-label={t('platformLabel')} className="flex gap-1 self-start rounded-md bg-sidebar p-1">
      {options.map((value) => {
        const active = platform === value;
        return (
          <Link
            key={value ?? 'all'}
            href={communityHref({ tag, platform: value, q })}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-8 items-center rounded px-3.5 font-display text-[0.6875rem] font-bold tracking-[0.08em] uppercase transition-colors',
              active
                ? 'glow-purple bg-purple text-white'
                : 'bg-card-raised text-muted-foreground hover:text-foreground',
            )}
          >
            {value ? t(`platforms.${value}`) : t('allPlatforms')}
          </Link>
        );
      })}
    </nav>
  );
}

/** Página pública da Comunidade BR: ao vivo agora, destaques, novidades e todos os criadores. */
export async function CommunityView({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const locale = (await getLocale()) as Locale;
  const [sp, all, t, format] = await Promise.all([
    searchParams,
    getPublishedCreators(),
    getTranslations('Community'),
    getFormatter(),
  ]);
  if (all === null) return <StateNotice state="sync_failed" title={t('unavailable')} />;

  const { tag, platform, q } = readParams(sp);
  const now = new Date();
  // O filtro de plataforma vale para a página inteira.
  const creators = platform
    ? all
        .map((c) => ({ ...c, channels: c.channels.filter((ch) => ch.platform === platform) }))
        .filter((c) => c.channels.length > 0)
    : all;
  const tracking = liveTracking();
  const live = creators
    .flatMap((creator) => creator.channels.filter((c) => c.isLive).map((channel) => ({ creator, channel })))
    .sort((a, b) => (b.channel.liveViewers ?? 0) - (a.channel.liveViewers ?? 0));
  const featured = creators.filter((c) => c.featured);
  const latest = creators
    .flatMap((creator) =>
      creator.channels
        .filter((c) => c.latestUrl && c.latestTitle && c.latestPublishedAt)
        .map((channel) => ({ creator, channel })),
    )
    .sort((a, b) => Date.parse(b.channel.latestPublishedAt!) - Date.parse(a.channel.latestPublishedAt!))
    .slice(0, 8);
  const needle = q.toLocaleLowerCase(locale);
  const directory = creators
    .filter((c) => !tag || c.tags.includes(tag))
    .filter((c) => !needle || c.name.toLocaleLowerCase(locale).includes(needle));
  const usedTags = CREATOR_TAGS.filter((x) => creators.some((c) => c.tags.includes(x)));

  const situation = (creator: CreatorView) => {
    if (creator.channels.some((c) => c.isLive))
      return (
        <span className="chip chip-lime">
          <span className="live-dot" aria-hidden />
          {t('live')}
        </span>
      );
    const recent = creator.channels.some(
      (c) => c.latestPublishedAt && now.getTime() - Date.parse(c.latestPublishedAt) < ONE_WEEK,
    );
    return recent ? (
      <span className="chip chip-cyan">{t('statusNew')}</span>
    ) : (
      <span className="chip chip-grey">{t('statusOffline')}</span>
    );
  };

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="live-now" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="live-now" className="text-2xl text-foreground sm:text-3xl">
            {t('liveNow')}
          </h2>
          {tracking.any && live.length > 0 && (
            <span className="chip chip-lime">
              <span className="live-dot" aria-hidden />
              {t('liveCount', { count: live.length })}
            </span>
          )}
        </div>
        {!tracking.any ? (
          <StateNotice state="not_available" title={t('liveSoon')} />
        ) : live.length === 0 ? (
          <p className="rounded-lg bg-card p-4 text-muted-foreground">{t('nobodyLive')}</p>
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {live.map(({ creator, channel }) => (
              <LiveCard key={channel.id} creator={creator} channel={channel} />
            ))}
          </ul>
        )}
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="flex flex-col gap-4">
          <h2 id="featured" className="flex items-center gap-2 text-2xl text-foreground sm:text-3xl">
            <Sparkles aria-hidden className="size-6 text-primary" />
            {t('featured')}
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {featured.map((creator) => {
              const note =
                (locale === 'pt-BR' ? creator.featuredNotePt : creator.featuredNoteEn) ??
                creator.featuredNotePt ??
                creator.featuredNoteEn;
              const bio = (locale === 'pt-BR' ? creator.bioPt : creator.bioEn) ?? creator.bioPt ?? creator.bioEn;
              return (
                <li key={creator.id} className="glass flex flex-col gap-4 p-6 sm:flex-row">
                  <CreatorAvatar creator={creator} className="size-16 text-lg" />
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="text-xl text-primary">{creator.name}</h3>
                    {note && <p className="text-foreground">{note}</p>}
                    {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
                    <div className="flex flex-wrap gap-3 pt-1">
                      {creator.channels.map((c) => (
                        <PlatformLink key={c.id} channel={c} />
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AdSlot placement="community" />

      {latest.length > 0 && (
        <section aria-labelledby="latest" className="flex flex-col gap-4">
          <h2 id="latest" className="text-2xl text-foreground sm:text-3xl">
            {t('latest')}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {latest.map(({ creator, channel }) => (
              <LatestCard
                key={channel.id}
                creator={creator}
                channel={channel}
                when={format.relativeTime(new Date(channel.latestPublishedAt!), now)}
              />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="directory" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="directory" className="text-2xl text-foreground sm:text-3xl">
            {t('directory')}
          </h2>
          <form method="get" className="relative w-full sm:w-80">
            {platform && <input type="hidden" name="platform" value={platform} />}
            {tag && <input type="hidden" name="tag" value={tag} />}
            <label htmlFor="creator-q" className="sr-only">
              {t('searchCreators')}
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
            />
            <input
              id="creator-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t('searchCreatorsPlaceholder')}
              className="min-h-10 w-full rounded-sm border border-transparent bg-card-raised pr-3 pl-9 text-foreground placeholder:text-faint focus:border-primary focus:shadow-[0_0_18px_rgb(197_251_20/0.25)] focus:outline-none"
            />
          </form>
        </div>

        {usedTags.length > 0 && (
          <nav aria-label={t('tagsLabel')} className="flex flex-wrap gap-1.5">
            {[null, ...usedTags].map((x) => {
              const active = tag === x;
              return (
                <Link
                  key={x ?? 'all'}
                  href={communityHref({ tag: x, platform, q })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-8 items-center rounded-sm px-3 font-display text-[0.6875rem] font-bold tracking-[0.08em] uppercase transition-colors',
                    active
                      ? 'bg-card-raised text-foreground shadow-[inset_0_0_0_1px_rgb(24_247_247/0.5)]'
                      : 'bg-card text-muted-foreground hover:bg-card-raised hover:text-foreground',
                  )}
                >
                  {x ? t(`tags.${x}`) : t('allTags')}
                </Link>
              );
            })}
          </nav>
        )}

        {directory.length === 0 ? (
          <StateNotice state="empty" title={t('empty')} />
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="hidden grid-cols-[2fr_1.2fr_1.6fr_1fr_auto] gap-3 px-4 md:grid" aria-hidden>
              {(['colCreator', 'colPlatforms', 'colTopics', 'colStatus'] as const).map((k) => (
                <span key={k} className="label">
                  {t(k)}
                </span>
              ))}
              <span className="w-24" />
            </div>
            <ul className="flex flex-col gap-1.5">
              {directory.map((creator) => {
                const bio = (locale === 'pt-BR' ? creator.bioPt : creator.bioEn) ?? creator.bioPt ?? creator.bioEn;
                const main = creator.channels.find((c) => c.isLive) ?? creator.channels[0];
                return (
                  <li
                    key={creator.id}
                    className="grid min-h-15 grid-cols-1 items-center gap-2 rounded-md bg-card px-4 py-3 transition-colors hover:bg-card-raised md:grid-cols-[2fr_1.2fr_1.6fr_1fr_auto] md:gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CreatorAvatar creator={creator} />
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-[0.8125rem] font-bold text-foreground">
                          {creator.name}
                        </h3>
                        {bio && <p className="truncate text-xs text-faint">{bio}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {creator.channels.map((c) => (
                        <PlatformLink key={c.id} channel={c} />
                      ))}
                    </div>
                    <ul className="flex flex-wrap gap-1" aria-label={t('tagsLabel')}>
                      {creator.tags.map((x) => (
                        <li key={x} className="chip">
                          {t(`tags.${x}`)}
                        </li>
                      ))}
                    </ul>
                    <div>{situation(creator)}</div>
                    {main ? (
                      <a
                        href={main.isLive ? (main.liveUrl ?? main.url) : main.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses('secondary', 'sm', 'md:w-24')}
                      >
                        {t('seeChannel')}
                        <span className="sr-only">
                          {' '}
                          {creator.name} ({t('opensNewTab')})
                        </span>
                      </a>
                    ) : (
                      <span />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Link href="/community/join" className={buttonClasses('brand', 'md', 'self-start', 'skew')}>
          {t('joinCta')}
        </Link>
      </section>
    </div>
  );
}
