'use server';

import { BATTLENET_REGIONS, currentCycle, uuidSchema } from '@wowhelp/shared';
import { refresh } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/session';
import { getMyProfile } from '@/features/profile/queries';
import { createClient } from '@/lib/supabase/server';

export type TaskFormState =
  { status: 'idle' } | { status: 'ok'; at: number } | { status: 'error'; code: 'invalid' | 'quota' | 'unknown' };

const taskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  cadence: z.enum(['weekly', 'daily']),
  minutes: z.union([z.literal(''), z.coerce.number().int().min(1).max(600)]),
  priority: z.coerce.number().int().min(1).max(5).default(3),
});

export async function createTaskAction(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  if (!(await getCurrentUser())) return { status: 'error', code: 'unknown' };
  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    cadence: formData.get('cadence'),
    minutes: formData.get('minutes') ?? '',
    priority: formData.get('priority') ?? 3,
  });
  if (!parsed.success) return { status: 'error', code: 'invalid' };

  const supabase = await createClient();
  const { error } = await supabase.from('recurring_tasks').insert({
    title: parsed.data.title,
    cadence: parsed.data.cadence,
    estimated_minutes: parsed.data.minutes === '' ? null : parsed.data.minutes,
    priority: parsed.data.priority,
  });
  if (error) return { status: 'error', code: error.message.includes('quota') ? 'quota' : 'unknown' };
  refresh();
  return { status: 'ok', at: Date.now() };
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  if (!(await getCurrentUser())) return;
  const id = uuidSchema.safeParse(formData.get('taskId'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('recurring_tasks').delete().eq('id', id.data);
  refresh();
}

/**
 * Marca/desmarca a tarefa no ciclo atual. O ciclo é calculado aqui no servidor
 * (região do perfil), nunca enviado pelo navegador.
 */
export async function toggleTaskAction(taskId: string, done: boolean): Promise<{ ok: boolean }> {
  if (!(await getCurrentUser())) return { ok: false };
  const id = uuidSchema.safeParse(taskId);
  if (!id.success) return { ok: false };

  const supabase = await createClient();
  const { data: task } = await supabase.from('recurring_tasks').select('cadence').eq('id', id.data).maybeSingle();
  if (!task) return { ok: false };
  const profile = await getMyProfile();
  const region = z
    .enum(BATTLENET_REGIONS)
    .catch('us')
    .parse(profile?.preferredGameRegion ?? 'us');
  const cycle = currentCycle(region, task.cadence === 'daily' ? 'daily' : 'weekly', new Date());

  const { error } = done
    ? await supabase
        .from('task_completions')
        .upsert({ task_id: id.data, cycle_key: cycle.key }, { onConflict: 'task_id,cycle_key', ignoreDuplicates: true })
    : await supabase.from('task_completions').delete().eq('task_id', id.data).eq('cycle_key', cycle.key);
  refresh();
  return { ok: !error };
}
