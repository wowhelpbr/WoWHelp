import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/session';
import { getMySupport } from '@/features/billing/queries';
import { createClient } from '@/lib/supabase/server';
import {
  evaluateAchievements,
  levelFromXp,
  titleFor,
  totalXp,
  weeklyStreak,
  type AchievementState,
  type LevelInfo,
  type Progress,
  type Snapshot,
  type TitleKey,
} from './rules';

const count = z.coerce.number().int().min(0).catch(0);
const progressSchema = z.object({
  steps_done: count,
  goals_done: count,
  weekly_done: count,
  daily_done: count,
  weekly_cycles: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).catch([]),
  manual_marks: count,
  mounts: count,
  pets: count,
  toys: count,
  battlenet: z.boolean().catch(false),
  addon: z.boolean().catch(false),
});

export interface Gamification {
  userId: string;
  xp: number;
  level: LevelInfo;
  title: TitleKey;
  streak: number;
  achievements: AchievementState[];
  progress: Progress;
  /** O que o navegador compara para saber o que comemorar. */
  snapshot: Snapshot;
}

/** Nível, XP, sequência e conquistas da conta logada (uma consulta, com RLS). */
export const getMyGamification = cache(async (): Promise<Gamification | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data, error }, support] = await Promise.all([supabase.rpc('my_progress'), getMySupport()]);
  if (error || !data) return null;
  const raw = progressSchema.parse(data);
  const progress: Progress = {
    stepsDone: raw.steps_done,
    goalsDone: raw.goals_done,
    weeklyDone: raw.weekly_done,
    dailyDone: raw.daily_done,
    weeklyCycles: raw.weekly_cycles,
    manualMarks: raw.manual_marks,
    mounts: raw.mounts,
    pets: raw.pets,
    toys: raw.toys,
    battlenet: raw.battlenet,
    addon: raw.addon,
  };
  const xp = totalXp(progress);
  const level = levelFromXp(xp);
  const streak = weeklyStreak(progress.weeklyCycles);
  const achievements = evaluateAchievements({ progress, streak, supporter: support?.active === true });
  return {
    userId: user.id,
    xp,
    level,
    title: titleFor(level.level),
    streak,
    achievements,
    progress,
    snapshot: {
      xp,
      level: level.level,
      goalsDone: progress.goalsDone,
      achievements: achievements.filter((a) => a.unlocked).map((a) => a.id),
    },
  };
});
