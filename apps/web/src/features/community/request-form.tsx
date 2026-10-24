'use client';

import { useTranslations } from 'next-intl';
import { startTransition, useActionState, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, inputClasses } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { submitCreatorRequestAction, type RequestFormState } from './actions';

const initial: RequestFormState = { status: 'idle' };

/** "Quero ser listado" ou "quero sair da lista". O curador lê e decide. */
export function CreatorRequestForm() {
  const t = useTranslations('Community.request');
  const [state, action, pending] = useActionState(submitCreatorRequestAction, initial);
  const [kind, setKind] = useState<'join' | 'leave'>('join');

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  if (state.status === 'sent') {
    return (
      <p role="status" className="rounded-sm border border-success/40 bg-success/10 px-4 py-3 text-success">
        {t(kind === 'join' ? 'sentJoin' : 'sentLeave')}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">{t('kindLabel')}</legend>
        {(['join', 'leave'] as const).map((k) => (
          <label
            key={k}
            className="flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-background/40 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:text-primary"
          >
            <input
              type="radio"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
              className="size-4 accent-primary"
            />
            {t(`kind.${k}`)}
          </label>
        ))}
      </fieldset>
      <Field id="displayName" name="displayName" required maxLength={60} label={t('displayName')} />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="links"
          className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
        >
          {t('links')}
        </label>
        <textarea
          id="links"
          name="links"
          required
          rows={3}
          maxLength={600}
          placeholder="https://www.twitch.tv/..."
          className={cn(inputClasses, 'w-full py-2')}
        />
        <p className="text-xs text-muted-foreground">{t('linksHint')}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="font-display text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
        >
          {t('message')}
        </label>
        <textarea id="message" name="message" rows={4} maxLength={1000} className={cn(inputClasses, 'w-full py-2')} />
      </div>
      {state.status === 'error' && (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.code}`)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t('privacy')}</p>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t('sending') : t('send')}
      </Button>
    </form>
  );
}
