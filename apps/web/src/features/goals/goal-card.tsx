'use client';

import { goalProgress } from '@wowhelp/shared';
import { Check, Pause, Play, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useOptimistic, useRef, useTransition } from 'react';
import { inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import {
  addStepAction,
  deleteGoalAction,
  deleteStepAction,
  setGoalStatusAction,
  toggleStepAction,
  type GoalFormState,
} from './actions';
import type { GoalView, StepView } from './queries';

const initial: GoalFormState = { status: 'idle' };

const iconButton =
  'inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-white/5 hover:text-foreground';

function StepRow({ step, onToggle }: { step: StepView; onToggle: (step: StepView) => void }) {
  const t = useTranslations('Goals');
  const done = step.completedAt !== null;
  return (
    <li className="group flex items-center gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? t('markOpen', { label: step.label }) : t('markDone', { label: step.label })}
        onClick={() => onToggle(step)}
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded border transition-colors',
          done
            ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_12px_rgb(197_251_20/0.45)]'
            : 'border-border-strong bg-card hover:border-primary',
        )}
      >
        {done && <Check aria-hidden className="size-4" />}
      </button>
      <span
        className={cn('min-w-0 flex-1 text-[0.95rem]', done ? 'text-muted-foreground line-through' : 'text-foreground')}
      >
        {step.label}
        {step.estimatedMinutes !== null && (
          <span className="ml-2 text-xs text-muted-foreground no-underline">
            {t('minutesValue', { minutes: step.estimatedMinutes })}
          </span>
        )}
      </span>
      <form action={deleteStepAction}>
        <input type="hidden" name="stepId" value={step.id} />
        <button
          type="submit"
          className={cn(iconButton, 'size-8 opacity-70 hover:opacity-100')}
          aria-label={t('deleteStep', { label: step.label })}
        >
          <X aria-hidden className="size-4" />
        </button>
      </form>
    </li>
  );
}

function AddStep({ goalId }: { goalId: string }) {
  const t = useTranslations('Goals');
  const [state, action, pending] = useActionState(addStepAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'ok') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-2 flex flex-col gap-1">
      <input type="hidden" name="goalId" value={goalId} />
      <div className="flex gap-2">
        <label htmlFor={`step-${goalId}`} className="sr-only">
          {t('addStep')}
        </label>
        <input
          id={`step-${goalId}`}
          name="label"
          required
          maxLength={240}
          autoComplete="off"
          placeholder={t('stepPlaceholder')}
          className={cn(inputClasses, 'min-h-10 w-full min-w-0 flex-1 text-sm')}
        />
        <label htmlFor={`step-min-${goalId}`} className="sr-only">
          {t('stepMinutes')}
        </label>
        <select
          id={`step-min-${goalId}`}
          name="minutes"
          defaultValue=""
          className={cn(inputClasses, 'min-h-10 w-24 shrink-0 text-sm')}
        >
          <option value="">{t('minutesNone')}</option>
          {[5, 10, 15, 30, 45, 60, 90, 120].map((m) => (
            <option key={m} value={m}>
              {t('minutesValue', { minutes: m })}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-sm border border-border px-3 text-sm text-foreground hover:border-primary/70"
        >
          <Plus aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t('addStep')}</span>
          <span className="sr-only sm:hidden">{t('addStep')}</span>
        </button>
      </div>
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${state.code}`)}
        </p>
      )}
    </form>
  );
}

/** Um objetivo no formato do rastreador de missões: título dourado, etapas abaixo. */
export function GoalCard({ goal }: { goal: GoalView }) {
  const t = useTranslations('Goals');
  const [saving, startTransition] = useTransition();
  // Marcar etapa responde na hora; o servidor confirma em seguida.
  const [steps, setOptimisticStep] = useOptimistic(goal.steps, (current, changed: StepView) =>
    current.map((s) => (s.id === changed.id ? changed : s)),
  );
  const { done, total } = goalProgress(steps);
  const completed = goal.status === 'completed';

  const toggle = (step: StepView) => {
    const nextDone = step.completedAt === null;
    startTransition(async () => {
      setOptimisticStep({ ...step, completedAt: nextDone ? new Date().toISOString() : null });
      await toggleStepAction(step.id, nextDone);
    });
  };

  return (
    <article className="rounded-lg bg-sidebar p-3.5 sm:p-4" aria-labelledby={`goal-${goal.id}`} aria-busy={saving}>
      <header className="flex items-start gap-3">
        <span className="quest-mark mt-0.5" data-state={completed ? 'accepted' : 'available'} aria-hidden>
          {completed ? '✓' : '!'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={`goal-${goal.id}`} className={cn('text-lg', completed ? 'text-muted-foreground' : 'text-primary')}>
            {goal.title}
          </h3>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{total === 0 ? t('noSteps') : t('progress', { done, total })}</span>
            <span>{t(`status.${goal.status}`)}</span>
            <span>{t('priorityValue', { value: String(goal.priority) })}</span>
            <span>{t('sourceManual')}</span>
            {saving && (
              <span role="status" className="text-primary">
                {t('saving')}
              </span>
            )}
          </p>
        </div>
      </header>

      {total > 0 && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-card-raised"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={t('progress', { done, total })}
        >
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_12px_rgb(197_251_20/0.6)] transition-[width] duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      {steps.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-l border-primary/30 pl-3">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} onToggle={toggle} />
          ))}
        </ul>
      )}

      {!completed && <AddStep goalId={goal.id} />}

      <footer className="mt-3 flex flex-wrap items-center gap-1 border-t border-border/50 pt-2">
        {goal.status === 'active' && (
          <>
            <StatusButton
              goalId={goal.id}
              status="completed"
              icon={<Check aria-hidden className="size-4" />}
              label={t('complete')}
            />
            <StatusButton
              goalId={goal.id}
              status="paused"
              icon={<Pause aria-hidden className="size-4" />}
              label={t('pause')}
            />
          </>
        )}
        {goal.status === 'paused' && (
          <StatusButton
            goalId={goal.id}
            status="active"
            icon={<Play aria-hidden className="size-4" />}
            label={t('resume')}
          />
        )}
        {goal.status === 'completed' && (
          <StatusButton
            goalId={goal.id}
            status="active"
            icon={<RotateCcw aria-hidden className="size-4" />}
            label={t('reopen')}
          />
        )}
        <form
          action={deleteGoalAction}
          className="ml-auto"
          onSubmit={(event) => {
            if (!window.confirm(t('deleteConfirm', { title: goal.title }))) event.preventDefault();
          }}
        >
          <input type="hidden" name="goalId" value={goal.id} />
          <button type="submit" className={cn(iconButton, 'hover:text-danger')} aria-label={t('delete')}>
            <Trash2 aria-hidden className="size-4" />
          </button>
        </form>
      </footer>
    </article>
  );
}

function StatusButton({
  goalId,
  status,
  icon,
  label,
}: {
  goalId: string;
  status: 'active' | 'paused' | 'completed';
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <form action={setGoalStatusAction}>
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
      >
        {icon}
        {label}
      </button>
    </form>
  );
}
