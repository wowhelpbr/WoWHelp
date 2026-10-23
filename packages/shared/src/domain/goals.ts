import type { GoalStatus } from './enums';

export interface GoalStepLike {
  id: string;
  label: string;
  sortOrder: number;
  completedAt: string | null;
}

export interface GoalLike {
  id: string;
  title: string;
  status: GoalStatus;
  priority: number;
  createdAt: string;
  steps: readonly GoalStepLike[];
}

export function goalProgress(steps: readonly GoalStepLike[]): { done: number; total: number } {
  return { done: steps.filter((s) => s.completedAt !== null).length, total: steps.length };
}

/** Primeira etapa ainda aberta, pela ordem definida pelo jogador. */
export function nextOpenStep(steps: readonly GoalStepLike[]): GoalStepLike | null {
  return [...steps].sort((a, b) => a.sortOrder - b.sortOrder).find((s) => s.completedAt === null) ?? null;
}

/**
 * "Próximas ações" do dashboard: objetivos ativos, prioridade 1 primeiro,
 * depois os mais antigos. Ordenação estável e explicável.
 */
export function pickNextActions<T extends GoalLike>(goals: readonly T[], limit = 3): T[] {
  return goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => a.priority - b.priority || Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, limit);
}
