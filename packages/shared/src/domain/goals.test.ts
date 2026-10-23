import { describe, expect, it } from 'vitest';
import { goalProgress, nextOpenStep, pickNextActions, type GoalLike } from './goals';

const step = (id: string, sortOrder: number, done = false) => ({
  id,
  label: id,
  sortOrder,
  completedAt: done ? '2026-10-23T00:00:00Z' : null,
});

const goal = (id: string, priority: number, createdAt: string, status: GoalLike['status'] = 'active'): GoalLike => ({
  id,
  title: id,
  status,
  priority,
  createdAt,
  steps: [],
});

describe('goalProgress', () => {
  it('conta etapas feitas e total', () => {
    expect(goalProgress([step('a', 0, true), step('b', 1), step('c', 2, true)])).toEqual({ done: 2, total: 3 });
    expect(goalProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe('nextOpenStep', () => {
  it('respeita a ordem definida pelo jogador', () => {
    expect(nextOpenStep([step('c', 2), step('a', 0, true), step('b', 1)])?.id).toBe('b');
  });

  it('retorna null quando tudo está feito', () => {
    expect(nextOpenStep([step('a', 0, true)])).toBeNull();
  });
});

describe('pickNextActions', () => {
  it('só ativos, prioridade 1 primeiro, depois mais antigos, até o limite', () => {
    const goals = [
      goal('p3-old', 3, '2026-10-01T00:00:00Z'),
      goal('p1-new', 1, '2026-10-20T00:00:00Z'),
      goal('paused', 1, '2026-09-01T00:00:00Z', 'paused'),
      goal('p1-old', 1, '2026-10-02T00:00:00Z'),
      goal('done', 1, '2026-09-01T00:00:00Z', 'completed'),
      goal('p5', 5, '2026-09-01T00:00:00Z'),
    ];
    expect(pickNextActions(goals).map((g) => g.id)).toEqual(['p1-old', 'p1-new', 'p3-old']);
  });
});
