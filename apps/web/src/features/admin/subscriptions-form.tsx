'use client';

import { useTranslations } from 'next-intl';
import { startTransition, useActionState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { saveSubscriptionsOpenAction, type SubscriptionsSettingsState } from './subscriptions-settings';

const initial: SubscriptionsSettingsState = { status: 'idle' };

/** Chave "venda aberta ao público" do WoWHelp Apoiador. */
export function SubscriptionsForm({ isOpen, testMode }: { isOpen: boolean; testMode: boolean }) {
  const t = useTranslations('Admin.supporters');
  const [state, action, pending] = useActionState(saveSubscriptionsOpenAction, initial);

  // Envio manual: o form não volta ao estado inicial depois de salvar.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex items-start gap-3 rounded-sm border border-border bg-background/40 p-4">
        <input type="checkbox" name="open" defaultChecked={isOpen} className="mt-1 size-4 accent-primary" />
        <span>
          <span className="block font-semibold text-foreground">{t('openLabel')}</span>
          <span className="text-sm text-muted-foreground">{t('openHint')}</span>
        </span>
      </label>
      {testMode && <p className="text-sm text-warning">{t('testWarning')}</p>}
      {state.status === 'error' && (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.code}`)}
        </p>
      )}
      {state.status === 'saved' && (
        <p role="status" className="text-sm text-success">
          {state.open ? t('savedOpen') : t('savedClosed')}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
