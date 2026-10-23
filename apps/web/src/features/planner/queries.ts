import 'server-only';
import { currentCycle, type BattlenetRegion, type Cadence } from '@wowhelp/shared';
import { createClient } from '@/lib/supabase/server';

export interface TaskView {
  id: string;
  title: string;
  cadence: Cadence;
  estimatedMinutes: number | null;
  priority: number;
  active: boolean;
  doneThisCycle: boolean;
  cycleEndsAt: string;
}

export interface OpenStepView {
  id: string;
  label: string;
  goalTitle: string;
  goalPriority: number;
  estimatedMinutes: number | null;
}

/** Tarefas recorrentes com o status do ciclo atual e os próximos passos abertos dos objetivos ativos. */
export async function getPlannerData(region: BattlenetRegion, now: Date) {
  const supabase = await createClient();
  const weekly = currentCycle(region, 'weekly', now);
  const daily = currentCycle(region, 'daily', now);

  const [tasks, completions, goals] = await Promise.all([
    supabase
      .from('recurring_tasks')
      .select('id, title, cadence, estimated_minutes, priority, active')
      .order('priority')
      .order('created_at'),
    supabase.from('task_completions').select('task_id, cycle_key').in('cycle_key', [weekly.key, daily.key]),
    supabase
      .from('goals')
      .select('title, priority, goal_steps(id, label, sort_order, completed_at, estimated_minutes)')
      .eq('status', 'active'),
  ]);
  if (tasks.error || completions.error || goals.error) return null;

  const done = new Set((completions.data ?? []).map((c) => `${c.task_id}|${c.cycle_key}`));
  const taskViews: TaskView[] = (tasks.data ?? []).map((t) => {
    const cycle = t.cadence === 'daily' ? daily : weekly;
    return {
      id: t.id,
      title: t.title,
      cadence: t.cadence as Cadence,
      estimatedMinutes: t.estimated_minutes,
      priority: t.priority,
      active: t.active,
      doneThisCycle: done.has(`${t.id}|${cycle.key}`),
      cycleEndsAt: cycle.endsAt.toISOString(),
    };
  });

  // Só o próximo passo aberto de cada objetivo: a sessão avança objetivos em ordem.
  const steps: OpenStepView[] = [];
  for (const g of goals.data ?? []) {
    const open = (g.goal_steps ?? [])
      .filter((s) => s.completed_at === null)
      .sort((a, b) => a.sort_order - b.sort_order)[0];
    if (open) {
      steps.push({
        id: open.id,
        label: open.label,
        goalTitle: g.title,
        goalPriority: g.priority,
        estimatedMinutes: open.estimated_minutes,
      });
    }
  }

  return { tasks: taskViews, steps, weekly, daily };
}
