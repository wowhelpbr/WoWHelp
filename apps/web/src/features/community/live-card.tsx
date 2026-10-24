import type { CreatorPlatform } from '@wowhelp/shared';
import { Eye } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/cn';
import type { ChannelView, CreatorView } from './queries';

/** Cor de cada plataforma no nome (proposta neon). */
export const PLATFORM_TEXT: Record<CreatorPlatform, string> = {
  twitch: 'text-[#a970ff]',
  youtube: 'text-[#ff6b6b]',
  kick: 'text-[#53fc18]',
};

/** Foto do criador em quadrado de cantos suaves (ou as iniciais). */
export function CreatorAvatar({ creator, className }: { creator: CreatorView; className?: string }) {
  const src = creator.channels.find((c) => c.avatarUrl)?.avatarUrl ?? null;
  const initials = creator.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn(
        'relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-purple to-[#2c1660] font-display text-xs font-bold text-white',
        className,
      )}
    >
      {src ? <Image src={src} alt="" fill unoptimized sizes="48px" className="object-cover" /> : initials}
    </span>
  );
}

/** Cartão de quem está ao vivo: miniatura, etiqueta "Ao vivo", espectadores e o criador. */
export async function LiveCard({ creator, channel }: { creator: CreatorView; channel: ChannelView }) {
  const t = await getTranslations('Community');
  return (
    <li>
      <a
        href={channel.liveUrl ?? channel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-lg bg-card transition-colors hover:bg-card-raised"
      >
        <span className="relative block aspect-video bg-gradient-to-br from-[#1d2a3a] to-[#2a1847]">
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
          <span className="chip chip-lime absolute top-2.5 left-2.5">
            <span className="live-dot" aria-hidden />
            {t('live')}
          </span>
          {channel.liveViewers !== null && (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 font-display text-[0.6875rem] font-bold text-white">
              <Eye aria-hidden className="size-3" />
              {t('viewers', { count: channel.liveViewers })}
            </span>
          )}
        </span>
        <span className="flex flex-1 items-center gap-3 p-3">
          <CreatorAvatar creator={creator} />
          <span className="min-w-0">
            <span className="block truncate font-display text-[0.8125rem] font-bold tracking-[0.02em] text-foreground uppercase group-hover:text-primary">
              {creator.name}
            </span>
            <span className="block truncate text-xs text-faint">
              <span className={cn('font-extrabold', PLATFORM_TEXT[channel.platform])}>
                {t(`platforms.${channel.platform}`)}
              </span>
              {' · '}
              {channel.liveTitle ?? channel.liveGame ?? ''}
            </span>
          </span>
        </span>
      </a>
    </li>
  );
}

/** Cartão de vídeo novo (quando ninguém está ao vivo). */
export async function LatestCard({
  creator,
  channel,
  when,
}: {
  creator: CreatorView;
  channel: ChannelView;
  when: string;
}) {
  return (
    <li>
      <a
        href={channel.latestUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-lg bg-card transition-colors hover:bg-card-raised"
      >
        <span className="relative block aspect-video bg-gradient-to-br from-[#1d2a3a] to-[#2a1847]">
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
        <span className="flex flex-1 items-center gap-3 p-3">
          <CreatorAvatar creator={creator} />
          <span className="min-w-0">
            <span className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
              {channel.latestTitle}
            </span>
            <span className="block truncate text-xs text-faint">
              {creator.name} · {when}
            </span>
          </span>
        </span>
      </a>
    </li>
  );
}
