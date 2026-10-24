'use client';

import Image from 'next/image';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { Gift, PawPrint } from 'lucide-react';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { Link } from '@/i18n/navigation';

const MAX_TILT = 9; // graus

/** Card com a imagem oficial em destaque e efeito de profundidade no mouse. */
export function CollectibleCard({
  href,
  name,
  subtitle,
  imageUrl,
  imageMode = 'render',
  placeholder = 'mount',
  badges,
  statusChip,
  owned = false,
}: {
  href: string;
  name: string;
  subtitle: ReactNode;
  imageUrl: string | null;
  /** icon = ícone pequeno do jogo (brinquedos), mostrado em tamanho fixo. */
  imageMode?: 'render' | 'icon';
  /** Ícone mostrado enquanto não há imagem. */
  placeholder?: 'mount' | 'pet' | 'toy';
  badges?: ReactNode;
  /** Etiqueta de situação (tenho / falta) no canto da imagem. */
  statusChip?: ReactNode;
  /** Coletado: a luz da imagem fica limão em vez de ciano. */
  owned?: boolean;
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
      className="frame tilt-card group flex h-full flex-col overflow-hidden hover:bg-card-raised focus-visible:bg-card-raised"
    >
      <span className="tilt-stage relative block aspect-square" data-owned={owned ? 'true' : undefined}>
        {statusChip && <span className="absolute top-2.5 left-2.5 z-10">{statusChip}</span>}
        {imageUrl && imageMode === 'icon' ? (
          <span className="tilt-art absolute inset-0 grid place-items-center">
            <span className="relative size-20 overflow-hidden rounded-md shadow-[0_0_0_2px_rgb(24_247_247/0.6),0_0_28px_rgb(24_247_247/0.35)]">
              <Image src={imageUrl} alt="" fill unoptimized sizes="80px" className="object-cover" />
            </span>
          </span>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="tilt-art object-contain p-[9%] drop-shadow-[0_14px_18px_rgb(0_0_0/0.55)]"
          />
        ) : (
          <span className="tilt-art absolute inset-0 grid place-items-center">
            <PlaceholderIcon kind={placeholder} className="size-16 text-unknown/60" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 px-3.5 pt-3 pb-3.5">
        <span className="font-display text-sm leading-snug font-bold tracking-[0.02em] text-foreground uppercase group-hover:text-primary">
          {name}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-faint">{subtitle}</span>
        {badges && <span className="mt-auto flex flex-wrap gap-1.5 pt-1.5">{badges}</span>}
      </span>
    </Link>
  );
}

const PLACEHOLDER = { mount: MountGlyph, pet: PawPrint, toy: Gift } as const;

function PlaceholderIcon({ kind, className }: { kind: keyof typeof PLACEHOLDER; className: string }) {
  const Icon = PLACEHOLDER[kind];
  return <Icon aria-hidden className={className} />;
}
