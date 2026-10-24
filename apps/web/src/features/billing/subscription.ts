import type Stripe from 'stripe';

// Regras puras da assinatura Apoiador (sem rede nem banco), testadas em
// tests/unit/billing.test.ts.

/** Preços criados no Stripe, achados pelo "lookup key" (não muda entre teste e produção). */
export const PLAN_LOOKUP_KEYS = { monthly: 'apoiador_mensal', yearly: 'apoiador_anual' } as const;
export type SupporterPlan = keyof typeof PLAN_LOOKUP_KEYS;
export const SUPPORTER_PLANS = Object.keys(PLAN_LOOKUP_KEYS) as SupporterPlan[];

/** Situações do Stripe que contam como apoiador (past_due: o Stripe ainda está tentando cobrar). */
const SUPPORTER_STATUSES = new Set(['active', 'trialing', 'past_due']);
/** Folga se um aviso do Stripe se perder: depois disso, o fim do período pago manda. */
const GRACE_MS = 7 * 86_400_000;

export interface SubscriptionRow {
  id: string;
  user_id: string;
  customer_id: string;
  status: string;
  plan: SupporterPlan | null;
  current_period_end: string | null;
  cancel_at: string | null;
  livemode: boolean;
}

export function planFromLookupKey(key: string | null | undefined): SupporterPlan | null {
  return SUPPORTER_PLANS.find((plan) => PLAN_LOOKUP_KEYS[plan] === key) ?? null;
}

const iso = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null);

/** Linha do banco a partir da assinatura do Stripe (o fim do período fica no item, desde 2025). */
export function subscriptionRow(sub: Stripe.Subscription, userId: string): SubscriptionRow {
  const item = sub.items.data[0];
  return {
    id: sub.id,
    user_id: userId,
    customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    status: sub.status,
    plan: planFromLookupKey(item?.price.lookup_key),
    current_period_end: iso(item?.current_period_end),
    cancel_at: iso(sub.cancel_at),
    livemode: sub.livemode,
  };
}

export function isSupporter(
  row: Pick<SubscriptionRow, 'status' | 'current_period_end'> | null | undefined,
  now = Date.now(),
): boolean {
  if (!row || !SUPPORTER_STATUSES.has(row.status)) return false;
  return !row.current_period_end || Date.parse(row.current_period_end) + GRACE_MS > now;
}

/**
 * Qual assinatura um aviso do Stripe mexeu (e, no fim do pagamento, de qual
 * conta). Outros avisos são ignorados.
 */
export function subscriptionFromEvent(event: Stripe.Event): { subscriptionId: string; userHint: string | null } | null {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode !== 'subscription' || !session.subscription) return null;
    const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    return { subscriptionId: id, userHint: session.client_reference_id ?? null };
  }
  if (event.type.startsWith('customer.subscription.')) {
    const sub = event.data.object as Stripe.Subscription;
    return typeof sub.id === 'string' && sub.id.startsWith('sub_') ? { subscriptionId: sub.id, userHint: null } : null;
  }
  return null;
}
