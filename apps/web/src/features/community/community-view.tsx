import { CREATOR_TAGS, type CreatorPlatform, type CreatorTag, type Locale } from '@wowhelp/shared';
import { ExternalLink, Radio, Sparkles, Users } from 'lucide-react';
import Image from 'next/image';
import { connection } from 'next/server';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/button';
import { StateNotice } from '@/components/ui/data-state';
import { AdSlot } from '@/features/ads/ads';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { liveTracking } from './live-config';
import { getPublishedCreators, type ChannelView, type CreatorView } from './queries';

const PLATFORM_STYLE: Record<CreatorPlatform, string> = {
  twitch: 'border-[#9146ff]/60 bg-[#9146ff]/15 text-[#c4a8ff]',
  youtube: 'border-[#ff3b3b]/60 bg-[#ff3b3b]/15 text-[#ff9a9a]',
  kick: 'border-[#53fc18]/50 bg-[#53fc18]/10 text-[#9dff74]',
};

async function PlatformLink({ channel }: { channel: ChannelView }) {
  const t = await getTranslations('Community');
  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase hover:brightness-125',
        PLATFORM_STYLE[channel.platform],
      )}
    >
      {t(`platforms.${channel.platform}`)}
      <ExternalLink aria-hidden className="size-3" />
      <span className="sr-only">{t('opensNewTab')}</span>
    </a>
  );
}

function Avatar({ creator, size }: { creator: CreatorView; size: 'md' | 'lg' }) {
  const src = creator.channels.find((c) => c.avatarUrl)?.avatarUrl ?? null;
  const box = size === 'lg' ? 'size-20 text-2xl' : 'size-14 text-lg';
  const initials = creator.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-primary/70 bg-card-raised font-display text-primary',
        box,
      )}
    >
      {src ? <Image src={src} alt="" fill unoptimized sizes="80px" className="object-cover" /> : initials}
    </span>
  );
}

async function LiveCard({ creator, channel }: { creator: CreatorView; channel: ChannelView }) {
  const t = await getTranslations('Community');
  return (
    <li>
      <a
        href={channel.liveUrl ?? channel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="frame group flex h-full flex-col overflow-hidden hover:border-danger/70"
      >
        <span className="relative block aspect-video bg-background">
          {channel.liveThumbnailUrl && (
            <Image
              src={channel.liveThumbnailUrl}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          )}
          <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-sm bg-danger px-2 py-0.5 text-xs font-bold tracking-wider text-white uppercase">
            <Radio aria-hidden className="size-3.5" />
            {t('live')}
          </span>
          {channel.liveViewers !== null && (
            <span className="absolute right-2 bottom-2 rounded-sm bg-black/70 px-2 py-0.5 text-xs text-white">
              {t('viewers', { count: channel.liveViewers })}
            </span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
            {channel.liveTitle ?? creator.name}
          </span>
          <span className="text-sm text-muted-foreground">
            {creator.name} · {t(`platforms.${channel.platform}`)}
            {channel.liveGame ? ` · ${channel.liveGame}` : ''}
          </span>
        </span>
      </a>
    </li>
  );
}

async function CreatorCard({ creator, locale }: { creator: CreatorView; locale: Locale }) {
  const t = await getTranslations('Community');
  const bio = (locale === 'pt-BR' ? creator.bioPt : creator.bioEn) ?? creator.bioPt ?? creator.bioEn;
  const live = creator.channels.some((c) => c.isLive);
  return (
    <li className="frame flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar creator={creator} size="md" />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg text-foreground">{creator.name}</h3>
          {live && (
            <span className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-danger uppercase">
              <Radio aria-hidden className="size-3" />
              {t('live')}
            </span>
          )}
        </div>
      </div>
      {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
      {creator.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('tagsLabel')}>
          {creator.tags.map((tag) => (
            <li key={tag} className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {t(`tags.${tag}`)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {creator.channels.map((c) => (
          <PlatformLink key={c.id} channel={c} />
        ))}
      </div>
    </li>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Página pública da Comunidade BR: ao vivo agora, destaques, novidades e diretório. */
export async function CommunityView({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const locale = (await getLocale()) as Locale;
  const [sp, creators, t, format] = await Promise.all([
    searchParams,
    getPublishedCreators(),
    getTranslations('Community'),
    getFormatter(),
  ]);
  if (creators === null) return <StateNotice state="sync_failed" title={t('unavailable')} />;

  const tag =
    typeof sp.tag === 'string' && (CREATOR_TAGS as readonly string[]).includes(sp.tag) ? (sp.tag as CreatorTag) : null;
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
  const directory = tag ? creators.filter((c) => c.tags.includes(tag)) : creators;
  const usedTags = CREATOR_TAGS.filter((x) => creators.some((c) => c.tags.includes(x)));
  const now = new Date();

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="live-now" className="flex flex-col gap-4">
        <h2 id="live-now" className="flex items-center gap-2 text-2xl text-foreground">
          <Radio aria-hidden className="size-6 text-danger" />
          {t('liveNow')}
        </h2>
        {!tracking.any ? (
          <StateNotice state="not_available" title={t('liveSoon')} />
        ) : live.length === 0 ? (
          <p className="text-muted-foreground">{t('nobodyLive')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {live.map(({ creator, channel }) => (
              <LiveCard key={channel.id} creator={creator} channel={channel} />
            ))}
          </ul>
        )}
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="flex flex-col gap-4">
          <h2 id="featured" className="flex items-center gap-2 text-2xl text-foreground">
            <Sparkles aria-hidden className="size-6 text-primary" />
            {t('featured')}
          </h2>
          <ul className="grid gap-4 lg:grid-cols-2">
            {featured.map((creator) => {
              const note =
                (locale === 'pt-BR' ? creator.featuredNotePt : creator.featuredNoteEn) ??
                creator.featuredNotePt ??
                creator.featuredNoteEn;
              const bio = (locale === 'pt-BR' ? creator.bioPt : creator.bioEn) ?? creator.bioPt ?? creator.bioEn;
              return (
                <li key={creator.id} className="frame corner-brackets hex-grid flex flex-col gap-4 p-6 sm:flex-row">
                  <Avatar creator={creator} size="lg" />
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="font-display text-2xl text-primary">{creator.name}</h3>
                    {note && <p className="text-foreground">{note}</p>}
                    {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
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
          <h2 id="latest" className="text-2xl text-foreground">
            {t('latest')}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {latest.map(({ creator, channel }) => (
              <li key={channel.id}>
                <a
                  href={channel.latestUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="frame group flex h-full flex-col overflow-hidden hover:border-neon/60"
                >
                  <span className="relative block aspect-video bg-background">
                    {channel.latestThumbnailUrl && (
                      <Image
                        src={channel.latestThumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-1 p-3">
                    <span className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
                      {channel.latestTitle}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {creator.name} · {format.relativeTime(new Date(channel.latestPublishedAt!), now)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="directory" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="directory" className="flex items-center gap-2 text-2xl text-foreground">
            <Users aria-hidden className="size-6 text-neon" />
            {t('directory')}
          </h2>
          <Link href="/community/join" className={buttonClasses('secondary', 'sm')}>
            {t('joinCta')}
          </Link>
        </div>
        {usedTags.length > 0 && (
          <nav aria-label={t('tagsLabel')} className="flex flex-wrap gap-2">
            <Link
              href="/community"
              aria-current={tag === null ? 'page' : undefined}
              className={cn(
                'rounded-sm border px-3 py-1 text-sm',
                tag === null
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {t('allTags')}
            </Link>
            {usedTags.map((x) => (
              <Link
                key={x}
                href={`/community?tag=${x}`}
                aria-current={tag === x ? 'page' : undefined}
                className={cn(
                  'rounded-sm border px-3 py-1 text-sm',
                  tag === x
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`tags.${x}`)}
              </Link>
            ))}
          </nav>
        )}
        {directory.length === 0 ? (
          <StateNotice state="empty" title={t('empty')} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {directory.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} locale={locale} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
