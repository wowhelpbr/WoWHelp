'use client';

import { MailCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { signInAction, signUpAction, type AuthFormState } from './actions';

const initial: AuthFormState = { status: 'idle' };

/**
 * Garante os campos vindos da URL mesmo se o envio acontecer antes de o trecho
 * em streaming chegar (autopreenchimento + Enter). O servidor valida de novo.
 */
function withUrlParams(dispatch: (formData: FormData) => void, keys: readonly string[]) {
  return (formData: FormData) => {
    const params = new URLSearchParams(window.location.search);
    for (const key of keys) {
      const value = params.get(key);
      if (!formData.has(key) && value) formData.set(key, value);
    }
    dispatch(formData);
  };
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

/** extraFields: campos que dependem da URL (next), carregados à parte para o formulário não ser trocado. */
export function SignInForm({ extraFields }: { extraFields?: ReactNode }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={withUrlParams(action, ['next'])} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {extraFields}
      <Field
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        label={t('email')}
        defaultValue={state.status === 'error' ? state.email : undefined}
      />
      <Field
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label={t('password')}
      />
      <FormError message={state.status === 'error' ? t(`errors.${state.code}`) : undefined} />
      <Button type="submit" disabled={pending}>
        {pending ? t('pending') : t('submitSignIn')}
      </Button>
    </form>
  );
}

export function SignUpForm({ extraFields }: { extraFields?: ReactNode }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [state, action, pending] = useActionState(signUpAction, initial);

  if (state.status === 'check_email') {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-sm border border-success/40 bg-success/10 p-4">
        <p className="flex items-center gap-2 font-medium text-success">
          <MailCheck aria-hidden className="size-5" />
          {t('checkEmailTitle')}
        </p>
        <p className="text-sm text-foreground">{t('checkEmailBody', { email: state.email })}</p>
      </div>
    );
  }

  return (
    <form action={withUrlParams(action, ['focus'])} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {extraFields}
      <Field
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        label={t('email')}
        defaultValue={state.status === 'error' ? state.email : undefined}
      />
      <Field
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        label={t('password')}
        hint={t('passwordHint')}
      />
      <FormError message={state.status === 'error' ? t(`errors.${state.code}`) : undefined} />
      <Button type="submit" disabled={pending}>
        {pending ? t('pending') : t('submitSignUp')}
      </Button>
    </form>
  );
}
