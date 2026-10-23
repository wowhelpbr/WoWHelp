'use client';

import Image from 'next/image';
import { useRef, type PointerEvent } from 'react';
import { Gift, PawPrint } from 'lucide-react';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { cn } from '@/lib/cn';

const MAX_TILT = 7;

/** Palco grande da imagem oficial na página/janela de detalhes, com profundidade no mouse. */
export function TiltStage({
  imageUrl,
  imageMode = 'render',
  placeholder = 'mount',
  className,
}: {
  imageUrl: string | null;
  imageMode?: 'render' | 'icon';
  /** Ícone mostrado enquanto não há imagem. */
  placeholder?: 'mount' | 'pet' | 'toy';
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
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
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn('frame tilt-card tilt-stage hex-grid corner-brackets relative aspect-[4/3]', className)}
    >
      {imageUrl && imageMode === 'icon' ? (
        <div className="tilt-art absolute inset-0 grid place-items-center">
          <div className="relative size-32 overflow-hidden rounded-sm border-2 border-primary/70 shadow-[0_0_40px_rgb(60_200_255/0.4)]">
            <Image src={imageUrl} alt="" fill unoptimized priority sizes="128px" className="object-cover" />
          </div>
        </div>
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          unoptimized
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="tilt-art object-contain p-6 drop-shadow-[0_26px_30px_rgb(0_0_0/0.6)]"
        />
      ) : (
        <div className="tilt-art absolute inset-0 grid place-items-center">
          <PlaceholderIcon kind={placeholder} className="size-24 text-unknown/60" />
        </div>
      )}
    </div>
  );
}

const PLACEHOLDER = { mount: MountGlyph, pet: PawPrint, toy: Gift } as const;

function PlaceholderIcon({ kind, className }: { kind: keyof typeof PLACEHOLDER; className: string }) {
  const Icon = PLACEHOLDER[kind];
  return <Icon aria-hidden className={className} />;
}
