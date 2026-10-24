'use client';

import { Check, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useOptimistic, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { inputClasses } from '@/components/ui/field';
import { toggleStepAction } from '@/features/goals/actions';
import { cn } from '@/lib/cn';
import { createTaskAction, deleteTaskAction, toggleTaskAction, type TaskFormState } from './actions';
import type { TaskView } from './queries';

export interface PlanItemView {
  id: string;
  kind: 'task' | 'step';
  title: string;
  context?: string;
  minutes: number | null;
  cadence?: 'weekly' | 'daily';
}

function CheckBox({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-sm border transition-colors',
        checked
          ? 'border-success bg-success/20 text-success'
          : 'border-border-strong bg-background/60 hover:border-primary',
      )}
    >
      {checked && <Check aria-hidden className="size-4" />}
    </button>
  );
}

/** Lista da sessão: marcar aqui conclui a tarefa no ciclo ou o passo do objetivo. */
export function PlanList({ items }: { items: PlanItemView[] }) {
  const t = useTranslations('Planner');
  const [saving, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(new Set<string>(), (current, id: string) => new Set([...current, id]));

  return (
    <ol className="flex flex-col gap-2" aria-busy={saving}>
      {items.map((item, index) => {
        const checked = done.has(item.id);
        return (
          <li key={item.id} className="flex items-center gap-3 rounded-sm border border-border bg-background/40 p-3">
            <span className="quest-mark" data-state={checked ? 'accepted' : 'available'} aria-hidden>
              {checked ? '✓' : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('font-semibold', checked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {[
                  item.kind === 'task' ? t(item.cadence === 'daily' ? 'dailyTag' : 'weeklyTag') : item.context,
                  item.minutes ? t('minutes', { minutes: item.minutes }) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <CheckBox
              checked={checked}
              label={t('markDone', { title: item.title })}
              onToggle={() =>
                !checked &&
                startTransition(async () => {
                  setDone(item.id);
                  if (item.kind === 'task') await toggleTaskAction(item.id, true);
                  else await toggleStepAction(item.id, true);
                })
              }
            />
          </li>
        );
      })}
    </ol>
  );
}

const initial: TaskFormState = { status: 'idle' };

export function TaskComposer() {
  const t = useTranslations('Planner');
  const [state, action, pending] = useActionState(createTaskAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'ok') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="@container flex flex-col gap-2">
      <div className="grid gap-2 @2xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-title"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {t('taskTitle')}
          </label>
          <input
            id="task-title"
            name="title"
            required
            maxLength={120}
            autoComplete="off"
            placeholder={t('taskPlaceholder')}
            className={cn(inputClasses, 'w-full min-w-0')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-cadence"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {t('cadence')}
          </label>
          <select id="task-cadence" name="cadence" defaultValue="weekly" className={inputClasses}>
            <option value="weekly">{t('cadences.weekly')}</option>
            <option value="daily">{t('cadences.daily')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-minutes"
            className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {t('taskMinutes')}
          </label>
          <select id="task-minutes" name="minutes" defaultValue="" className={inputClasses}>
            <option value="">{t('minutesNone')}</option>
            {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {t('minutes', { minutes: m })}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending} className="self-end">
          <Plus aria-hidden className="size-4" />
          {t('addTask')}
        </Button>
      </div>
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${state.code}`)}
        </p>
      )}
    </form>
  );
}

export function TaskList({ tasks }: { tasks: TaskView[] }) {
  const t = useTranslations('Planner');
  const [saving, startTransition] = useTransition();
  const [state, toggle] = useOptimistic(tasks, (current, change: { id: string; done: boolean }) =>
    current.map((x) => (x.id === change.id ? { ...x, doneThisCycle: change.done } : x)),
  );

  if (state.length === 0) return <p className="text-sm text-muted-foreground">{t('tasksEmpty')}</p>;

  return (
    <ul className="flex flex-col gap-2" aria-busy={saving}>
      {state.map((task) => (
        <li key={task.id} className="flex items-center gap-3 rounded-sm border border-border bg-background/40 p-3">
          <CheckBox
            checked={task.doneThisCycle}
            label={task.doneThisCycle ? t('markOpen', { title: task.title }) : t('markDone', { title: task.title })}
            onToggle={() =>
              startTransition(async () => {
                toggle({ id: task.id, done: !task.doneThisCycle });
                await toggleTaskAction(task.id, !task.doneThisCycle);
              })
            }
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'font-semibold',
                task.doneThisCycle ? 'text-muted-foreground line-through' : 'text-foreground',
              )}
            >
              {task.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {[
                t(task.cadence === 'daily' ? 'dailyTag' : 'weeklyTag'),
                task.estimatedMinutes ? t('minutes', { minutes: task.estimatedMinutes }) : null,
                task.doneThisCycle ? t('doneThisCycle') : null,
                t('sourceManual'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <form
            action={deleteTaskAction}
            onSubmit={(e) => {
              if (!window.confirm(t('deleteTask', { title: task.title }) + '?')) e.preventDefault();
            }}
          >
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              aria-label={t('deleteTask', { title: task.title })}
              className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-white/5 hover:text-danger"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
