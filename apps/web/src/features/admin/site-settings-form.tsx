'use client';

import { useTranslations } from 'next-intl';
import { startTransition, useActionState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataStateBadge } from '@/components/ui/data-state';
import { Field } from '@/components/ui/field';
import { saveSiteSettingsAction, type SiteSettingsState } from './site-settings';

const initial: SiteSettingsState = { status: 'idle' };

/** Site privado (com senha) ou aberto ao público. */
export function SiteSettingsForm({ isPrivate, hasPassword }: { isPrivate: boolean; hasPassword: boolean }) {
  const t = useTranslations('Admin.site');
  const [state, action, pending] = useActionState(saveSiteSettingsAction, initial);
  const nowPrivate = state.status === 'saved' ? state.private : isPrivate;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DataStateBadge
        state={nowPrivate ? 'stale' : 'ok'}
        label={nowPrivate ? t('statusPrivate') : t('statusPublic')}
        className="self-start"
      />
      <label className="flex items-start gap-3 rounded-sm border border-border bg-background/40 p-4">
        <input type="checkbox" name="private" defaultChecked={isPrivate} className="mt-1 size-4 accent-primary" />
        <span>
          <span className="block font-semibold text-foreground">{t('privateLabel')}</span>
          <span className="text-sm text-muted-foreground">{t('privateHint')}</span>
        </span>
      </label>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 font-display text-lg text-primary">
          {hasPassword ? t('changePassword') : t('setPassword')}
        </legend>
        <Field
          id="site-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          label={t('password')}
          hint={hasPassword ? t('keepHint') : t('minHint')}
        />
        <Field id="site-confirm" name="confirm" type="password" autoComplete="new-password" label={t('confirm')} />
      </fieldset>
      {state.status === 'error' && (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.code}`)}
        </p>
      )}
      {state.status === 'saved' && (
        <p role="status" className="text-sm text-success">
          {state.private ? t('savedPrivate') : t('savedPublic')}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
