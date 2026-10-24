'use client';

import { m } from 'motion/react';
import { Link } from '@/i18n/navigation';

/** Nível no cabeçalho: hexágono limão com o número e a barra de XP do nível. */
export function XpBadge({ level, ratio, label }: { level: number; ratio: number; label: string }) {
  return (
    <Link
      href="/dashboard#jornada"
      aria-label={label}
      title={label}
      className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/5"
    >
      <span className="quest-mark text-[0.8125rem]" data-state="accepted" aria-hidden>
        {level}
      </span>
      <span className="hidden w-16 flex-col gap-1 sm:flex" aria-hidden>
        <span className="h-1.5 overflow-hidden rounded-full bg-card-raised">
          <m.span
            className="block h-full origin-left rounded-full bg-primary shadow-[0_0_10px_rgb(197_251_20/0.7)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0.04, Math.min(1, ratio)) }}
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          />
        </span>
      </span>
    </Link>
  );
}
