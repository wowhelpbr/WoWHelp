'use client';

import Image from 'next/image';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link } from '@/i18n/navigation';

const MAX_TILT = 9; // graus

/** Card com a imagem oficial em destaque e efeito de profundidade no mouse. */
export function CollectibleCard({
  href,
  name,
  subtitle,
  imageUrl,
  badges,
}: {
  href: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  badges?: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    const s = ref.current.style;
    s.setProperty('--ry', `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
    s.setProperty('--rx', `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`);
    s.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    s.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  }

  function onLeave() {
    const s = ref.current?.style;
    if (!s) return;
    for (const v of ['--rx', '--ry', '--mx', '--my']) s.removeProperty(v);
  }

  return (
    <Link
      ref={ref}
      href={href}
      scroll={false}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="frame tilt-card group flex h-full flex-col hover:border-neon/60 focus-visible:border-neon"
    >
      <span className="tilt-stage hex-grid relative block aspect-[4/3] border-b border-border">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="tilt-art object-contain p-3 drop-shadow-[0_18px_22px_rgb(0_0_0/0.55)]"
          />
        ) : (
          <span className="tilt-art absolute inset-0 grid place-items-center">
            <MountGlyph aria-hidden className="size-16 text-unknown/60" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-lg leading-snug font-semibold text-foreground group-hover:text-primary">{name}</span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
        {badges && <span className="mt-auto flex flex-wrap gap-2 pt-2">{badges}</span>}
      </span>
    </Link>
  );
}
