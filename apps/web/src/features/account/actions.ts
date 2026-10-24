'use server';

import { localeSchema } from '@wowhelp/shared';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/session';
import { cancelAllSubscriptions } from '@/features/billing/sync';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { logEvent } from '@/lib/log';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export type DeleteAccountState =
  { status: 'idle' } | { status: 'error'; code: 'mismatch' | 'failed' | 'not_configured' | 'billing' };

/**
 * Exclui a conta e, em cascata no banco, todos os dados dela (perfil,
 * objetivos, planejador, Battle.net, addon). Pede o e-mail da conta digitado
 * como confirmação. Não tem volta. Antes, cancela no Stripe a assinatura
 * Apoiador (sem isso, a cobrança continuaria sem conta).
 */
export async function deleteAccountAction(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!isAdminConfigured()) return { status: 'error', code: 'not_configured' };

  const typed = String(formData.get('confirm_email') ?? '')
    .trim()
    .toLowerCase();
  if (!user.email || typed !== user.email.toLowerCase()) return { status: 'error', code: 'mismatch' };

  if (!(await cancelAllSubscriptions(getStripe(), user.id))) {
    logEvent('supporter_cancel_failed');
    return { status: 'error', code: 'billing' };
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) return { status: 'error', code: 'failed' };
  logEvent('account_deleted');

  // A conta já não existe: só limpa os cookies da sessão neste navegador.
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // sem sessão para limpar
  }

  const locale = localeSchema.safeParse(formData.get('locale'));
  redirect(`${LOCALE_PREFIX[locale.success ? locale.data : routing.defaultLocale]}/account-deleted`);
}
