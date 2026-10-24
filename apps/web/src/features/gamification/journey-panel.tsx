import {
  FileUp,
  Flame,
  Footprints,
  Gem,
  Gift,
  ListChecks,
  Lock,
  PawPrint,
  Plug,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { MountGlyph } from '@/components/brand/mount-glyph';
import { cn } from '@/lib/cn';
import { CountUp, ProgressBar, RevealItem } from './motion';
import { getMyGamification } from './queries';
import { XP, type AchievementIcon } from './rules';

const ICONS: Record<AchievementIcon, LucideIcon | typeof MountGlyph> = {
  footprints: Footprints,
  'list-checks': ListChecks,
  target: Target,
  trophy: Trophy,
  flame: Flame,
  mount: MountGlyph,
  paw: PawPrint,
  gift: Gift,
  plug: Plug,
  'file-up': FileUp,
  gem: Gem,
};

/** Nível, XP, sequência de semanas e conquistas (Desafio, Submissão e Expressão). */
export async function JourneyPanel() {
  const [g, t, locale] = await Promise.all([getMyGamification(), getTranslations('Gamification'), getLocale()]);
  if (!g) return null;
  const unlocked = g.achievements.filter((a) => a.unlocked).length;
  // Desbloqueadas primeiro; depois as mais perto de sair.
  const ordered = [...g.achievements].sort(
    (a, b) => Number(b.unlocked) - Number(a.unlocked) || b.current / b.target - a.current / a.target,
  );
  const max = g.level.needed === 0;

  return (
    <section
      id="jornada"
      aria-labelledby="journey-title"
      className="glass corner-brackets relative flex scroll-mt-24 flex-col gap-5 p-5 sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center gap-4">
          <span className="quest-mark h-[4.5rem]! w-16! text-2xl!" data-state="accepted" aria-hidden>
            {g.level.level}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="journey-title" className="label">
              {t('journeyTitle')}
            </h2>
            <p className="mt-1 font-display text-2xl leading-none font-bold text-foreground uppercase sm:text-3xl">
              {t('level', { level: g.level.level })} ·{' '}
              <span className="text-primary [text-shadow:0_0_20px_rgb(197_251_20/0.4)]">{t(`titles.${g.title}`)}</span>
            </p>
            <ProgressBar
              ratio={g.level.ratio}
              className="mt-3"
              label={
                max
                  ? t('xpMax')
                  : t('xpToNext', { current: g.level.current, needed: g.level.needed, next: g.level.level + 1 })
              }
            />
            <p className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {max
                  ? t('xpMax')
                  : t('xpToNext', { current: g.level.current, needed: g.level.needed, next: g.level.level + 1 })}
              </span>
              <span className="font-display font-bold text-foreground tabular-nums">
                <CountUp value={g.xp} locale={locale} /> XP
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-sidebar p-4">
          <span
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full',
              g.streak > 0
                ? 'bg-[radial-gradient(circle,rgb(248_183_42/0.3),transparent_70%)] text-warning'
                : 'bg-card-raised text-faint',
            )}
            aria-hidden
          >
            <Flame className="size-5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold text-foreground">{t('streak', { count: g.streak })}</p>
            <p className="text-xs text-faint">{t('streakHint')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base text-foreground">{t('achievementsTitle')}</h3>
          <span className="chip chip-lime">{t('achievementsCount', { unlocked, total: g.achievements.length })}</span>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {ordered.map((a, i) => {
            const Icon = ICONS[a.icon];
            return (
              <RevealItem
                key={a.id}
                index={i}
                className={cn(
                  'flex flex-col gap-2 rounded-lg p-3',
                  a.unlocked ? 'bg-card-raised shadow-[inset_0_0_0_1px_rgb(197_251_20/0.45)]' : 'bg-sidebar',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md',
                      a.unlocked ? 'glow-lime bg-primary text-primary-foreground' : 'bg-card text-faint',
                    )}
                    aria-hidden
                  >
                    {a.unlocked ? <Icon className="size-4" /> : <Lock className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <b
                      className={cn(
                        'block truncate font-display text-[0.75rem] leading-tight font-bold uppercase',
                        a.unlocked ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {t(`achievements.${a.id}.name`)}
                    </b>
                    <span className="sr-only">{a.unlocked ? t('unlocked') : t('locked')}</span>
                  </span>
                </div>
                <p className="text-xs text-faint">{t(`achievements.${a.id}.description`)}</p>
                {!a.unlocked && a.target > 1 && (
                  <ProgressBar
                    ratio={a.current / a.target}
                    tone="cyan"
                    className="h-1.5"
                    label={t('progress', { current: a.current, target: a.target })}
                  />
                )}
              </RevealItem>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-faint">
        {t('howXp', { step: XP.step, goal: XP.goal, weekly: XP.weekly, daily: XP.daily, mark: XP.manualMark })}{' '}
        {t('howXpNote')}
      </p>
    </section>
  );
}
