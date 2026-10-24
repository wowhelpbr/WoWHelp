'use client';

import { LazyMotion, MotionConfig, animate, domAnimation, m, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';

// Peças de movimento do WoWHelp (motion.dev). Carrega só o pacote leve de
// animação (LazyMotion + m.*). Quem pede "menos movimento" no aparelho não
// vê deslocamento: os valores aparecem prontos.

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const EASE = [0.2, 0.7, 0.2, 1] as const;

/**
 * Item de lista que sobe um pouco ao entrar na tela (em cascata pelo índice).
 * Só transforma, sem esconder: o conteúdo é visível mesmo antes de animar.
 */
export function RevealItem({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <m.li
      className={className}
      initial={{ y: 18, scale: 0.98 }}
      whileInView={{ y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.4, delay: Math.min(index % 12, 11) * 0.035, ease: EASE }}
    >
      {children}
    </m.li>
  );
}

/** Número que sobe contando quando aparece na tela. */
export function CountUp({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const format = (n: number) => new Intl.NumberFormat(locale).format(n);

  useEffect(() => {
    const node = ref.current;
    if (!inView || reduce || !node || value === 0) return;
    const controls = animate(0, value, {
      duration: Math.min(1.2, 0.4 + value / 2000),
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = new Intl.NumberFormat(locale).format(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, locale]);

  return <span ref={ref}>{format(value)}</span>;
}

/** Barra de progresso com mola (0 a 1), com o brilho limão da proposta. */
export function ProgressBar({
  ratio,
  label,
  tone = 'lime',
  className,
}: {
  ratio: number;
  label: string;
  tone?: 'lime' | 'cyan';
  className?: string;
}) {
  const value = Math.max(0, Math.min(1, ratio));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={`h-2 overflow-hidden rounded-full bg-card-raised ${className ?? ''}`}
    >
      <m.div
        className={
          tone === 'cyan'
            ? 'h-full origin-left rounded-full bg-neon shadow-[0_0_12px_rgb(24_247_247/0.6)]'
            : 'h-full origin-left rounded-full bg-primary shadow-[0_0_12px_rgb(197_251_20/0.6)]'
        }
        initial={{ scaleX: 0 }}
        animate={{ scaleX: value }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/** Pequeno "pop" com mola, para a marca de concluído. */
export function Pop({ children, show }: { children: ReactNode; show: boolean }) {
  if (!show) return null;
  return (
    <m.span
      className="grid place-items-center"
      initial={{ scale: 0.3, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
    >
      {children}
    </m.span>
  );
}
