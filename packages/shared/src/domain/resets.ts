import type { BattlenetRegion } from '../blizzard/normalize';

/**
 * Calendário de reset por região, em UTC.
 *
 * - Europa: quarta-feira 05:00 CET (= 04:00 UTC), fixo desde 16/11/2022 —
 *   anúncio oficial da Blizzard:
 *   https://eu.forums.blizzard.com/en/wow/t/weekly-reset-time-changing-to-0500-cet-on-16-november/398498
 * - Américas: terça-feira 15:00 UTC. ESTIMATIVA: só fontes de terceiros, que
 *   discordam sobre o horário de verão (consultado em 23/10/2026).
 * - Coreia e Taiwan: quarta-feira 23:00 UTC. ESTIMATIVA (terceiros).
 * - Reset diário: mesma hora do semanal, todos os dias. ESTIMATIVA em todas as
 *   regiões (a Blizzard não publica).
 *
 * A interface mostra "estimado" quando `weeklyStatus` não é 'official'. O addon
 * (Fase 5) pode confirmar o horário exato pelo próprio jogo.
 */
export const RESET_SCHEDULE: Record<
  BattlenetRegion,
  { weekday: number; hourUtc: number; weeklyStatus: 'official' | 'estimated'; source: string }
> = {
  us: { weekday: 2, hourUtc: 15, weeklyStatus: 'estimated', source: 'https://vaultalts.com/reset-timer' },
  eu: {
    weekday: 3,
    hourUtc: 4,
    weeklyStatus: 'official',
    source: 'https://eu.forums.blizzard.com/en/wow/t/weekly-reset-time-changing-to-0500-cet-on-16-november/398498',
  },
  kr: {
    weekday: 3,
    hourUtc: 23,
    weeklyStatus: 'estimated',
    source: 'https://mmo-list.com/games/world-of-warcraft/reset',
  },
  tw: {
    weekday: 3,
    hourUtc: 23,
    weeklyStatus: 'estimated',
    source: 'https://mmo-list.com/games/world-of-warcraft/reset',
  },
};

export type Cadence = 'weekly' | 'daily';

export interface Cycle {
  /** Ex.: "us-w-2026-10-20" (região, w/d, data UTC do início do ciclo). */
  key: string;
  startsAt: Date;
  endsAt: Date;
}

const DAY = 86_400_000;

/** Ciclo atual (semana ou dia) de uma região, a partir do horário de reset. */
export function currentCycle(region: BattlenetRegion, cadence: Cadence, now: Date): Cycle {
  const { weekday, hourUtc } = RESET_SCHEDULE[region];
  const todayReset = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc);
  let start: number;
  if (cadence === 'daily') {
    start = now.getTime() >= todayReset ? todayReset : todayReset - DAY;
  } else {
    const daysSince = (now.getUTCDay() - weekday + 7) % 7;
    start = todayReset - daysSince * DAY;
    if (start > now.getTime()) start -= 7 * DAY;
  }
  const startsAt = new Date(start);
  const length = cadence === 'daily' ? DAY : 7 * DAY;
  const stamp = startsAt.toISOString().slice(0, 10);
  return { key: `${region}-${cadence === 'daily' ? 'd' : 'w'}-${stamp}`, startsAt, endsAt: new Date(start + length) };
}

export interface PlanCandidate {
  id: string;
  kind: 'task' | 'step';
  title: string;
  /** Contexto exibido (ex.: título do objetivo do passo). */
  context?: string;
  estimatedMinutes: number | null;
  priority: number;
  /** Para tarefas: quando o ciclo atual acaba (tarefa perto de vencer vem antes). */
  endsAt?: Date;
}

export interface SessionPlan {
  items: PlanCandidate[];
  plannedMinutes: number;
  /** Itens que não couberam no tempo escolhido. */
  leftover: PlanCandidate[];
  /** Itens sem estimativa: listados à parte, nunca somados como se coubessem. */
  unestimated: PlanCandidate[];
}

/**
 * Monta a sessão: primeiro o que vence antes (tarefas do ciclo), depois por
 * prioridade e pela menor duração; enche até o tempo escolhido. Ordem estável
 * e explicável; nada sem estimativa entra na conta.
 */
export function planSession(budgetMinutes: number, candidates: readonly PlanCandidate[]): SessionPlan {
  const estimated = candidates.filter((c) => c.estimatedMinutes !== null && c.estimatedMinutes > 0);
  const unestimated = candidates.filter((c) => !(c.estimatedMinutes !== null && c.estimatedMinutes > 0));
  const ordered = [...estimated].sort(
    (a, b) =>
      (a.endsAt?.getTime() ?? Infinity) - (b.endsAt?.getTime() ?? Infinity) ||
      a.priority - b.priority ||
      a.estimatedMinutes! - b.estimatedMinutes! ||
      a.title.localeCompare(b.title),
  );
  const items: PlanCandidate[] = [];
  const leftover: PlanCandidate[] = [];
  let used = 0;
  for (const c of ordered) {
    if (used + c.estimatedMinutes! <= budgetMinutes) {
      items.push(c);
      used += c.estimatedMinutes!;
    } else {
      leftover.push(c);
    }
  }
  return { items, plannedMinutes: used, leftover, unestimated };
}

export const SESSION_LENGTHS = [15, 30, 60, 120] as const;
