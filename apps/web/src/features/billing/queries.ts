import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { getCurrentUser } from '@/features/auth/session';
import { getStripe } from '@/lib/stripe/client';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LOOKUP_KEYS, SUPPORTER_PLANS, isSupporter, type SupporterPlan } from './subscription';

export interface MySupport {
  active: boolean;
  status: string;
  plan: SupporterPlan | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

/** Assinatura da conta logada (a mais recente), lida com a sessão dela (RLS). */
export const getMySupport = cache(async (): Promise<MySupport | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('supporter_subscriptions')
    .select('status, plan, current_period_end, cancel_at')
    .order('updated_at', { ascending: false })
    .limit(5);
  if (!data?.length) return null;
  const row = data.find((r) => isSupporter(r)) ?? data[0]!;
  return {
    active: isSupporter(row),
    status: row.status,
    plan: row.plan,
    currentPeriodEnd: row.current_period_end,
    cancelAt: row.cancel_at,
  };
});

/** Venda aberta ao público (chave da administração). O administrador testa mesmo fechada. */
export async function getSubscriptionsOpen(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const { data } = await createAdminClient()
    .from('site_settings')
    .select('subscriptions_open')
    .eq('id', true)
    .maybeSingle();
  return data?.subscriptions_open === true;
}

export interface PlanPrice {
  priceId: string;
  amount: number;
  currency: string;
}
export type PlanPrices = Record<SupporterPlan, PlanPrice>;

let pricesCache: { at: number; value: PlanPrices | null } | null = null;
const PRICES_TTL = 10 * 60_000;

/** Preços dos planos, lidos do Stripe (guardados 10 minutos). null se o Stripe não responde. */
export async function getPlanPrices(): Promise<PlanPrices | null> {
  // Lê o relógio e a rede: só na hora do pedido, nunca no pré-render.
  await connection();
  if (pricesCache && Date.now() - pricesCache.at < PRICES_TTL) return pricesCache.value;
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const list = await stripe.prices.list({ lookup_keys: Object.values(PLAN_LOOKUP_KEYS), active: true, limit: 10 });
    const entries = SUPPORTER_PLANS.map((plan) => {
      const price = list.data.find((p) => p.lookup_key === PLAN_LOOKUP_KEYS[plan]);
      return price?.unit_amount != null
        ? ([plan, { priceId: price.id, amount: price.unit_amount, currency: price.currency }] as const)
        : null;
    });
    const value = entries.every(Boolean)
      ? (Object.fromEntries(entries as NonNullable<(typeof entries)[number]>[]) as PlanPrices)
      : null;
    pricesCache = { at: Date.now(), value };
    return value;
  } catch {
    return null;
  }
}
