import { describe, expect, it } from 'vitest';
import {
  MAX_LEVEL,
  celebrationsBetween,
  evaluateAchievements,
  levelFromXp,
  titleFor,
  totalXp,
  weeklyStreak,
  xpToReach,
  type Progress,
} from '@/features/gamification/rules';

const empty: Progress = {
  stepsDone: 0,
  goalsDone: 0,
  weeklyDone: 0,
  dailyDone: 0,
  weeklyCycles: [],
  manualMarks: 0,
  mounts: 0,
  pets: 0,
  toys: 0,
  battlenet: false,
  addon: false,
};

describe('gamificação', () => {
  it('XP só pelo que se faz no site; coleção da Battle.net não dá XP', () => {
    expect(totalXp(empty)).toBe(0);
    expect(totalXp({ ...empty, stepsDone: 3, goalsDone: 1, weeklyDone: 2, dailyDone: 4, manualMarks: 5 })).toBe(
      3 * 10 + 50 + 2 * 15 + 4 * 5 + 5 * 3,
    );
    expect(totalXp({ ...empty, mounts: 400, pets: 900, toys: 200, battlenet: true })).toBe(0);
  });

  it('curva de nível: 100, 250, 450 de XP para os níveis 2, 3 e 4', () => {
    expect(xpToReach(1)).toBe(0);
    expect(xpToReach(2)).toBe(100);
    expect(xpToReach(3)).toBe(250);
    expect(xpToReach(4)).toBe(450);
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, needed: 100, ratio: 0 });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100)).toMatchObject({ level: 2, current: 0, needed: 150 });
    expect(levelFromXp(325)).toMatchObject({ level: 3, current: 75, needed: 200, ratio: 0.375 });
  });

  it('para no nível máximo', () => {
    const top = levelFromXp(10_000_000);
    expect(top.level).toBe(MAX_LEVEL);
    expect(top.ratio).toBe(1);
    expect(top.needed).toBe(0);
  });

  it('título acompanha a faixa de nível', () => {
    expect(titleFor(1)).toBe('recruit');
    expect(titleFor(5)).toBe('adventurer');
    expect(titleFor(19)).toBe('veteran');
    expect(titleFor(20)).toBe('champion');
    expect(titleFor(80)).toBe('mythic');
  });

  it('sequência de semanas: conta seguidas e cai depois de uma semana sem fazer', () => {
    const now = new Date('2026-10-24T12:00:00Z');
    expect(weeklyStreak([], now)).toBe(0);
    expect(weeklyStreak(['2026-10-20', '2026-10-13', '2026-10-06'], now)).toBe(3);
    // Esta semana ainda não fez, mas a anterior sim: continua.
    expect(weeklyStreak(['2026-10-13', '2026-10-06'], now)).toBe(2);
    // Buraco de uma semana interrompe a contagem.
    expect(weeklyStreak(['2026-10-20', '2026-10-06'], now)).toBe(1);
    // Última semana feita há mais de duas semanas: zerou.
    expect(weeklyStreak(['2026-10-06', '2026-09-29'], now)).toBe(0);
    // Regiões diferentes com a mesma semana não contam duas vezes.
    expect(weeklyStreak(['2026-10-20', '2026-10-20', '2026-10-21'], now)).toBe(1);
  });

  it('conquistas com progresso e desbloqueio', () => {
    const list = evaluateAchievements({
      progress: { ...empty, stepsDone: 1, mounts: 120, battlenet: true },
      streak: 2,
      supporter: false,
    });
    const byId = Object.fromEntries(list.map((a) => [a.id, a]));
    expect(byId.first_step).toMatchObject({ unlocked: true, current: 1, target: 1 });
    expect(byId.steps_50).toMatchObject({ unlocked: false, current: 1, target: 50 });
    expect(byId.mounts_100).toMatchObject({ unlocked: true, current: 100 });
    expect(byId.mounts_300).toMatchObject({ unlocked: false, current: 120 });
    expect(byId.streak_4).toMatchObject({ unlocked: false, current: 2 });
    expect(byId.battlenet.unlocked).toBe(true);
    expect(byId.supporter.unlocked).toBe(false);
  });

  it('comemora só o que subiu desde a última visita', () => {
    const seen = { xp: 90, level: 1, goalsDone: 0, achievements: ['battlenet' as const] };
    expect(
      celebrationsBetween(seen, {
        xp: 150,
        level: 2,
        goalsDone: 1,
        achievements: ['battlenet', 'first_goal'],
      }),
    ).toEqual({ xpGained: 60, levelUp: 2, goalCompleted: true, achievements: ['first_goal'] });
    // Desfazer um passo tira XP, mas não comemora nada.
    expect(celebrationsBetween(seen, { ...seen, xp: 80 })).toEqual({
      xpGained: 0,
      levelUp: null,
      goalCompleted: false,
      achievements: [],
    });
  });
});
