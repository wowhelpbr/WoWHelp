// Regras puras da gamificação (sem rede nem banco), testadas em
// tests/unit/gamification.test.ts.
//
// Diversões que isto serve (MDA, ver docs/design/gamificacao.md):
//  - Desafio: metas de coleção, objetivos e sequência de semanas;
//  - Submissão: marcar passos e semanais e ver o progresso subir;
//  - Expressão: nível, título e selos para mostrar.
// XP vem só do que o jogador faz no site. A coleção da Battle.net conta para
// as conquistas de coleção, mas não dá XP (a primeira sincronização não
// pode jogar ninguém no nível 30 de uma vez).

export interface Progress {
  stepsDone: number;
  goalsDone: number;
  weeklyDone: number;
  dailyDone: number;
  /** Datas (AAAA-MM-DD) de início das semanas com alguma semanal feita, mais recentes primeiro. */
  weeklyCycles: string[];
  manualMarks: number;
  mounts: number;
  pets: number;
  toys: number;
  battlenet: boolean;
  addon: boolean;
}

export const XP = {
  step: 10,
  goal: 50,
  weekly: 15,
  daily: 5,
  manualMark: 3,
} as const;

export const MAX_LEVEL = 80;

export function totalXp(p: Progress): number {
  return (
    p.stepsDone * XP.step +
    p.goalsDone * XP.goal +
    p.weeklyDone * XP.weekly +
    p.dailyDone * XP.daily +
    p.manualMarks * XP.manualMark
  );
}

/** XP acumulado para chegar ao nível n: cada nível pede 100 + 50 por nível já subido. */
export function xpToReach(level: number): number {
  const n = Math.max(1, Math.min(level, MAX_LEVEL));
  return 100 * (n - 1) + 25 * (n - 1) * (n - 2);
}

export interface LevelInfo {
  level: number;
  /** XP dentro do nível atual. */
  current: number;
  /** XP que o nível atual pede (0 no nível máximo). */
  needed: number;
  /** 0 a 1. */
  ratio: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpToReach(level + 1)) level++;
  if (level === MAX_LEVEL) return { level, current: xp - xpToReach(level), needed: 0, ratio: 1 };
  const floor = xpToReach(level);
  const needed = xpToReach(level + 1) - floor;
  const current = xp - floor;
  return { level, current, needed, ratio: current / needed };
}

/** Títulos por faixa de nível (Expressão). */
export const TITLES = [
  { from: 1, key: 'recruit' },
  { from: 5, key: 'adventurer' },
  { from: 10, key: 'veteran' },
  { from: 20, key: 'champion' },
  { from: 35, key: 'hero' },
  { from: 50, key: 'legend' },
  { from: 70, key: 'mythic' },
] as const;
export type TitleKey = (typeof TITLES)[number]['key'];

export function titleFor(level: number): TitleKey {
  let key: TitleKey = TITLES[0].key;
  for (const title of TITLES) if (level >= title.from) key = title.key;
  return key;
}

const DAY = 86_400_000;
const dayNumber = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);

/**
 * Semanas seguidas com alguma semanal feita. Continua valendo se a última
 * semana feita foi esta ou a anterior (a semana atual ainda pode ser feita).
 */
export function weeklyStreak(cycles: readonly string[], now: Date = new Date()): number {
  const days = [...new Set(cycles)]
    .map(dayNumber)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  if (days.length === 0) return 0;
  const today = Math.floor(now.getTime() / DAY);
  if (today - days[0]! > 13) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = days[i - 1]! - days[i]!;
    if (gap >= 6 && gap <= 8) streak++;
    else break;
  }
  return streak;
}

export interface AchievementContext {
  progress: Progress;
  streak: number;
  supporter: boolean;
}

export const ACHIEVEMENTS = [
  { id: 'first_step', icon: 'footprints', target: 1, value: (c: AchievementContext) => c.progress.stepsDone },
  { id: 'steps_50', icon: 'list-checks', target: 50, value: (c: AchievementContext) => c.progress.stepsDone },
  { id: 'first_goal', icon: 'target', target: 1, value: (c: AchievementContext) => c.progress.goalsDone },
  { id: 'goals_10', icon: 'trophy', target: 10, value: (c: AchievementContext) => c.progress.goalsDone },
  { id: 'streak_4', icon: 'flame', target: 4, value: (c: AchievementContext) => c.streak },
  { id: 'streak_12', icon: 'flame', target: 12, value: (c: AchievementContext) => c.streak },
  { id: 'mounts_100', icon: 'mount', target: 100, value: (c: AchievementContext) => c.progress.mounts },
  { id: 'mounts_300', icon: 'mount', target: 300, value: (c: AchievementContext) => c.progress.mounts },
  { id: 'pets_100', icon: 'paw', target: 100, value: (c: AchievementContext) => c.progress.pets },
  { id: 'toys_100', icon: 'gift', target: 100, value: (c: AchievementContext) => c.progress.toys },
  { id: 'battlenet', icon: 'plug', target: 1, value: (c: AchievementContext) => Number(c.progress.battlenet) },
  { id: 'addon', icon: 'file-up', target: 1, value: (c: AchievementContext) => Number(c.progress.addon) },
  { id: 'supporter', icon: 'gem', target: 1, value: (c: AchievementContext) => Number(c.supporter) },
] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];
export type AchievementIcon = (typeof ACHIEVEMENTS)[number]['icon'];

export interface AchievementState {
  id: AchievementId;
  icon: AchievementIcon;
  current: number;
  target: number;
  unlocked: boolean;
}

export function evaluateAchievements(context: AchievementContext): AchievementState[] {
  return ACHIEVEMENTS.map((a) => {
    const current = Math.min(a.value(context), a.target);
    return { id: a.id, icon: a.icon, current, target: a.target, unlocked: current >= a.target };
  });
}

/** O que o navegador guarda para saber o que já foi comemorado. */
export interface Snapshot {
  xp: number;
  level: number;
  goalsDone: number;
  achievements: AchievementId[];
}

export interface Celebration {
  xpGained: number;
  levelUp: number | null;
  goalCompleted: boolean;
  achievements: AchievementId[];
}

/** Diferença entre o que já foi visto e o estado atual (só o que subiu é comemorado). */
export function celebrationsBetween(seen: Snapshot, now: Snapshot): Celebration {
  return {
    xpGained: Math.max(0, now.xp - seen.xp),
    levelUp: now.level > seen.level ? now.level : null,
    goalCompleted: now.goalsDone > seen.goalsDone,
    achievements: now.achievements.filter((id) => !seen.achievements.includes(id)),
  };
}
