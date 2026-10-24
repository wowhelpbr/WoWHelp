'use client';

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { celebrationsBetween, titleFor, type AchievementId, type Snapshot, type TitleKey } from './rules';

type Toast =
  | { id: number; kind: 'xp'; xp: number }
  | { id: number; kind: 'level'; level: number; title: TitleKey }
  | { id: number; kind: 'goal'; xp: number }
  | { id: number; kind: 'achievement'; achievement: AchievementId };

const STORAGE = (userId: string) => `wowhelp:jornada:${userId}`;
const COLORS = ['#c5fb14', '#18f7f7', '#7a14f8', '#f1f5f9'];

/** Confete limão, ciano e roxo saindo de um ponto (só decoração). */
function Confetti({ pieces = 26 }: { pieces?: number }) {
  const reduce = useReducedMotion();
  const [bits] = useState(() =>
    Array.from({ length: pieces }, (_, i) => {
      const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 70 + Math.random() * 90;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 40,
        rotate: Math.random() * 540 - 270,
        color: COLORS[i % COLORS.length]!,
        size: 5 + Math.round(Math.random() * 4),
      };
    }),
  );
  if (reduce) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-8">
      {bits.map((b, i) => (
        <m.span
          key={i}
          className="absolute rounded-[1px]"
          style={{ width: b.size, height: b.size * 1.6, backgroundColor: b.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 60], opacity: [1, 1, 0], rotate: b.rotate }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        />
      ))}
    </span>
  );
}

/**
 * Comemora o que subiu desde a última visita: +XP, nível novo, objetivo
 * concluído e conquistas. O que já foi visto fica guardado só neste
 * navegador. Na primeira visita só anota, sem festa.
 */
export function Celebrations({ userId, snapshot }: { userId: string; snapshot: Snapshot }) {
  const t = useTranslations('Gamification');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const key = `${snapshot.xp}|${snapshot.level}|${snapshot.goalsDone}|${snapshot.achievements.join(',')}`;

  useEffect(() => {
    let seen: Snapshot | null = null;
    try {
      const raw = localStorage.getItem(STORAGE(userId));
      seen = raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      seen = null;
    }
    try {
      localStorage.setItem(STORAGE(userId), JSON.stringify(snapshot));
    } catch {
      // navegador sem armazenamento: só não comemora
    }
    if (!seen || typeof seen.xp !== 'number' || !Array.isArray(seen.achievements)) return;

    const c = celebrationsBetween(seen, snapshot);
    const next: Toast[] = [];
    const id = () => ++seq.current;
    if (c.levelUp) next.push({ id: id(), kind: 'level', level: c.levelUp, title: titleFor(snapshot.level) });
    if (c.goalCompleted) next.push({ id: id(), kind: 'goal', xp: c.xpGained });
    for (const a of c.achievements) next.push({ id: id(), kind: 'achievement', achievement: a });
    if (!c.levelUp && !c.goalCompleted && c.xpGained > 0) next.push({ id: id(), kind: 'xp', xp: c.xpGained });
    if (!next.length) return;
    // Mostra logo depois de a página assentar; cada aviso some sozinho.
    const timers = [
      window.setTimeout(() => setToasts((current) => [...current, ...next].slice(-4)), 120),
      ...next.map((toast, i) =>
        window.setTimeout(() => setToasts((current) => current.filter((x) => x.id !== toast.id)), 4600 + i * 600),
      ),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // O snapshot muda quando o servidor manda um estado novo (key resume tudo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key]);

  // Desenha direto no body: o cabeçalho (com vidro) prenderia a posição fixa.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 md:right-6 md:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className={
              toast.kind === 'level' || toast.kind === 'goal'
                ? 'glow-lime relative flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground'
                : 'glass relative flex items-center gap-3 bg-[rgb(15_22_30/0.94)] px-4 py-3'
            }
          >
            {(toast.kind === 'level' || toast.kind === 'goal' || toast.kind === 'achievement') && <Confetti />}
            {toast.kind === 'xp' && (
              <>
                <Zap aria-hidden className="size-5 text-primary" />
                <p className="font-display text-lg font-bold text-primary">{t('toastXp', { xp: toast.xp })}</p>
              </>
            )}
            {toast.kind === 'goal' && (
              <>
                <Trophy aria-hidden className="size-6" />
                <div>
                  <p className="font-display text-base font-bold uppercase">{t('toastGoal')}</p>
                  {toast.xp > 0 && <p className="text-sm font-semibold">{t('toastXp', { xp: toast.xp })}</p>}
                </div>
              </>
            )}
            {toast.kind === 'level' && (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-black/15 font-display text-lg font-bold">
                  {toast.level}
                </span>
                <div>
                  <p className="font-display text-base font-bold uppercase">
                    {t('toastLevel', { level: toast.level })}
                  </p>
                  <p className="text-sm font-semibold">{t('toastTitle', { title: t(`titles.${toast.title}`) })}</p>
                </div>
              </>
            )}
            {toast.kind === 'achievement' && (
              <>
                <span className="stat-icon size-10! text-primary!">
                  <Sparkles aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="label">{t('toastAchievement')}</p>
                  <p className="font-display text-base font-bold text-foreground uppercase">
                    {t(`achievements.${toast.achievement}.name`)}
                  </p>
                </div>
              </>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
