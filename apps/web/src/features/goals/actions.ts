'use server';

import { goalCreateSchema, goalStatusSchema, goalStepCreateSchema, uuidSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { getCurrentUser } from '@/features/auth/session';
import { createClient } from '@/lib/supabase/server';

export type GoalErrorCode = 'invalid_input' | 'invalid_step' | 'quota' | 'unauthenticated' | 'unknown';
export type GoalFormState =
  { status: 'idle' } | { status: 'ok'; at: number } | { status: 'error'; code: GoalErrorCode };

function dbError(error: { message?: string } | null): GoalErrorCode {
  if (error?.message?.includes('quota_exceeded')) return 'quota';
  return 'unknown';
}

// Toda ação revalida a sessão (getCurrentUser) e depende da RLS no banco.
// Nenhuma recebe user_id do cliente.

export async function createGoalAction(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  if (!(await getCurrentUser())) return { status: 'error', code: 'unauthenticated' };
  const parsed = goalCreateSchema.safeParse({
    title: formData.get('title'),
    priority: formData.get('priority') ?? undefined,
    notes: formData.get('notes') ?? undefined,
  });
  if (!parsed.success) return { status: 'error', code: 'invalid_input' };

  const supabase = await createClient();
  const { error } = await supabase.from('goals').insert({
    title: parsed.data.title,
    priority: parsed.data.priority,
    notes: parsed.data.notes ?? null,
  });
  if (error) return { status: 'error', code: dbError(error) };

  refresh();
  return { status: 'ok', at: Date.now() };
}

export async function setGoalStatusAction(formData: FormData): Promise<void> {
  if (!(await getCurrentUser())) return;
  const id = uuidSchema.safeParse(formData.get('goalId'));
  const status = goalStatusSchema.safeParse(formData.get('status'));
  if (!id.success || !status.success) return;

  const supabase = await createClient();
  await supabase
    .from('goals')
    .update({
      status: status.data,
      completed_at: status.data === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', id.data);
  refresh();
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  if (!(await getCurrentUser())) return;
  const id = uuidSchema.safeParse(formData.get('goalId'));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.from('goals').delete().eq('id', id.data);
  refresh();
}

export async function addStepAction(_prev: GoalFormState, formData: FormData): Promise<GoalFormState> {
  if (!(await getCurrentUser())) return { status: 'error', code: 'unauthenticated' };
  const parsed = goalStepCreateSchema.safeParse({
    goalId: formData.get('goalId'),
    label: formData.get('label'),
  });
  if (!parsed.success) return { status: 'error', code: 'invalid_step' };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from('goal_steps')
    .select('sort_order')
    .eq('goal_id', parsed.data.goalId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('goal_steps').insert({
    goal_id: parsed.data.goalId,
    label: parsed.data.label,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { status: 'error', code: dbError(error) };

  refresh();
  return { status: 'ok', at: Date.now() };
}

export async function toggleStepAction(stepId: string, done: boolean): Promise<{ ok: boolean }> {
  if (!(await getCurrentUser())) return { ok: false };
  const id = uuidSchema.safeParse(stepId);
  if (!id.success) return { ok: false };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from('goal_steps')
    .update({ completed_at: done ? new Date().toISOString() : null }, { count: 'exact' })
    .eq('id', id.data);
  refresh();
  return { ok: !error && count === 1 };
}

export async function deleteStepAction(formData: FormData): Promise<void> {
  if (!(await getCurrentUser())) return;
  const id = uuidSchema.safeParse(formData.get('stepId'));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.from('goal_steps').delete().eq('id', id.data);
  refresh();
}
