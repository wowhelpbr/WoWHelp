'use client';

import { Download, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { deleteAccountAction, type DeleteAccountState } from './actions';

const initial: DeleteAccountState = { status: 'idle' };

/** Exportar dados (JSON) e excluir conta, com o e-mail digitado como confirmação. */
export function AccountData() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const [state, action, pending] = useActionState(deleteAccountAction, initial);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg text-primary">{t('dataTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('dataBody')}</p>
        <a href="/api/account/export" download className={buttonClasses('secondary', 'md', 'self-start')}>
          <Download aria-hidden className="size-4" />
          {t('export')}
        </a>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <h3 className="font-display text-lg text-danger">{t('deleteTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('deleteBody')}</p>
        {!open ? (
          <Button variant="danger" className="self-start" onClick={() => setOpen(true)}>
            <Trash2 aria-hidden className="size-4" />
            {t('deleteStart')}
          </Button>
        ) : (
          <form action={action} className="flex flex-col gap-3 rounded-sm border border-danger/40 bg-danger/5 p-4">
            <input type="hidden" name="locale" value={locale} />
            <Field
              id="confirm-email"
              name="confirm_email"
              type="email"
              autoComplete="off"
              required
              label={t('deleteLabel')}
            />
            {state.status === 'error' && (
              <p role="alert" className="text-sm text-danger">
                {t(`errors.${state.code}`)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="danger" disabled={pending}>
                {pending ? t('deleting') : t('deleteConfirm')}
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
                {t('deleteCancel')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
