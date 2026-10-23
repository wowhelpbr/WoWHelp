'use server';

import { focusAreasSchema, localeSchema, signUpSchema, credentialsSchema } from '@wowhelp/shared';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LOCALE_PREFIX, routing, type AppLocale } from '@/i18n/routing';
import { safeNextPath } from '@/lib/safe-redirect';
import { getSiteUrl } from '@/lib/site-url';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { mapAuthError, type AuthErrorCode } from './errors';

export type AuthFormState =
  | { status: 'idle' }
  | { status: 'error'; code: AuthErrorCode; email?: string }
  | { status: 'check_email'; email: string };

function readLocale(formData: FormData): AppLocale {
  const parsed = localeSchema.safeParse(formData.get('locale'));
  return parsed.success ? parsed.data : routing.defaultLocale;
}

async function siteOrigin(): Promise<string> {
  // Em produção/preview vem do ambiente; localmente, do cabeçalho da requisição.
  if (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL) return getSiteUrl();
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3100';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = readLocale(formData);
  if (!isSupabaseConfigured()) return { status: 'error', code: 'not_configured' };

  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  const email = typeof formData.get('email') === 'string' ? String(formData.get('email')) : undefined;
  if (!parsed.success) return { status: 'error', code: 'invalid_input', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: 'error', code: mapAuthError(error), email };

  redirect(safeNextPath(formData.get('next'), `${LOCALE_PREFIX[locale]}/dashboard`));
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = readLocale(formData);
  if (!isSupabaseConfigured()) return { status: 'error', code: 'not_configured' };

  const email = typeof formData.get('email') === 'string' ? String(formData.get('email')) : undefined;
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.some((i) => i.path[0] === 'password');
    return { status: 'error', code: passwordIssue ? 'weak_password' : 'invalid_input', email };
  }

  const focus = focusAreasSchema.safeParse(
    String(formData.get('focus') ?? '')
      .split(',')
      .filter(Boolean),
  );
  const prefix = LOCALE_PREFIX[locale];

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${await siteOrigin()}${prefix}/auth/confirm?next=${encodeURIComponent(`${prefix}/dashboard`)}`,
      // Validados de novo no banco (trigger handle_new_user).
      data: { locale, focus_areas: focus.success ? focus.data : [] },
    },
  });
  if (error) return { status: 'error', code: mapAuthError(error), email };

  // Com confirmação de e-mail ligada não há sessão até o clique no link.
  if (!data.session) return { status: 'check_email', email: parsed.data.email };

  redirect(`${prefix}/dashboard`);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(LOCALE_PREFIX[locale]);
}
