import 'server-only';
import type { GoalLike, GoalStatus } from '@wowhelp/shared';
import { createClient } from '@/lib/supabase/server';

export interface StepView {
  id: string;
  label: string;
  sortOrder: number;
  completedAt: string | null;
  estimatedMinutes: number | null;
}

export interface GoalView extends GoalLike {
  notes: string | null;
  completedAt: string | null;
  updatedAt: string;
  steps: StepView[];
}

type GoalRow = {
  id: string;
  title: string;
  notes: string | null;
  status: GoalStatus;
  priority: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  goal_steps:
    | { id: string; label: string; sort_order: number; completed_at: string | null; estimated_minutes: number | null }[]
    | null;
};

export type GoalsResult = { status: 'ok'; goals: GoalView[] } | { status: 'error' };

/**
 * Objetivos do usuário logado. Não recebe user_id: a RLS limita às linhas
 * do dono do JWT, e a página só chama isto depois de getCurrentUser().
 */
export async function getMyGoals(): Promise<GoalsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .select(
      'id, title, notes, status, priority, created_at, updated_at, completed_at, goal_steps(id, label, sort_order, completed_at, estimated_minutes)',
    )
    .order('created_at', { ascending: true })
    .order('sort_order', { referencedTable: 'goal_steps', ascending: true })
    .returns<GoalRow[]>();

  if (error || !data) return { status: 'error' };

  return {
    status: 'ok',
    goals: data.map((row) => ({
      id: row.id,
      title: row.title,
      notes: row.notes,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      steps: (row.goal_steps ?? []).map((s) => ({
        id: s.id,
        label: s.label,
        sortOrder: s.sort_order,
        completedAt: s.completed_at,
        estimatedMinutes: s.estimated_minutes,
      })),
    })),
  };
}
