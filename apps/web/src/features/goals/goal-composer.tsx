'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { createGoalAction, type GoalFormState } from './actions';

const initial: GoalFormState = { status: 'idle' };

export function GoalComposer() {
  const t = useTranslations('Goals');
  const [state, action, pending] = useActionState(createGoalAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'ok') formRef.current?.reset();
  }, [state]);

  const error = state.status === 'error' ? t(`errors.${state.code}`) : undefined;

  return (
    <form ref={formRef} action={action} className="@container flex flex-col gap-2">
      <label htmlFor="goal-title" className="text-sm font-medium text-foreground">
        {t('composerLabel')}
      </label>
      <div className="flex flex-col gap-2 @2xl:flex-row">
        <input
          id="goal-title"
          name="title"
          required
          maxLength={160}
          autoComplete="off"
          placeholder={t('composerPlaceholder')}
          className={cn(inputClasses, 'w-full min-w-0 @2xl:flex-1')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'goal-title-error' : undefined}
        />
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="goal-priority">
            {t('priority')}
          </label>
          <select
            id="goal-priority"
            name="priority"
            defaultValue="3"
            className={cn(inputClasses, 'flex-1 @2xl:flex-none')}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {t('priorityValue', { value: String(value) })}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={pending} className="shrink-0">
            <Plus aria-hidden className="size-4" />
            {t('add')}
          </Button>
        </div>
      </div>
      {error && (
        <p id="goal-title-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
