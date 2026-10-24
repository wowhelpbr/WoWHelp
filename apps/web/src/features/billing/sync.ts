import 'server-only';
import type Stripe from 'stripe';
import type { CurrentUser } from '@/features/auth/session';
import { stripeMode } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { subscriptionRow } from './subscription';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = (v: unknown) => (typeof v === 'string' && UUID.test(v) ? v : null);

/**
 * Copia para o banco o estado atual de uma assinatura, lendo direto do Stripe
 * (assim a ordem em que os avisos chegam não importa). A conta vem do
 * cliente do Stripe que nós criamos; o metadado é só reserva.
 */
export async function syncSubscription(
  stripe: Stripe,
  subscriptionId: string,
  userHint: string | null = null,
): Promise<'saved' | 'no_user'> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const db = createAdminClient();
  const { data: owner } = await db.from('billing_customers').select('user_id').eq('id', customerId).maybeSingle();
  const userId = uuid(owner?.user_id) ?? uuid(sub.metadata?.user_id) ?? uuid(userHint);
  if (!userId) return 'no_user';
  const { error } = await db.from('supporter_subscriptions').upsert(subscriptionRow(sub, userId), { onConflict: 'id' });
  // Conta já excluída: nada para guardar.
  if (error?.code === '23503') return 'no_user';
  if (error) throw new Error(`supporter_subscriptions: ${error.code}`);
  return 'saved';
}

/** Cliente do Stripe da conta (cria na primeira assinatura, um por modo teste/produção). */
export async function ensureCustomer(stripe: Stripe, user: CurrentUser): Promise<string> {
  const db = createAdminClient();
  const livemode = stripeMode() === 'live';
  const { data } = await db.from('billing_customers').select('id, livemode').eq('user_id', user.id).maybeSingle();
  if (data && data.livemode === livemode) return data.id as string;

  const customer = await stripe.customers.create({
    ...(user.email ? { email: user.email } : {}),
    metadata: { user_id: user.id },
  });
  const { error } = await db
    .from('billing_customers')
    .upsert({ id: customer.id, user_id: user.id, livemode: customer.livemode }, { onConflict: 'user_id' });
  if (error) throw new Error(`billing_customers: ${error.code}`);
  return customer.id;
}

/** Cancela na hora as assinaturas ativas da conta (usado ao excluir a conta). */
export async function cancelAllSubscriptions(stripe: Stripe | null, userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('supporter_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .not('status', 'in', '(canceled,incomplete_expired)');
  if (error) return false;
  if (!data.length) return true;
  if (!stripe) return false;
  for (const row of data) {
    const id = row.id as string;
    try {
      await stripe.subscriptions.cancel(id);
    } catch {
      // Já cancelada no Stripe (aviso perdido) conta como cancelada.
      const current = await stripe.subscriptions.retrieve(id).catch(() => null);
      if (current?.status !== 'canceled' && current?.status !== 'incomplete_expired') return false;
    }
  }
  return true;
}
