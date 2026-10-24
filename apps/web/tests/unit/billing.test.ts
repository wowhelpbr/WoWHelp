import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';
import { formatPrice, monthsSaved } from '@/features/billing/format';
import {
  isSupporter,
  planFromLookupKey,
  subscriptionFromEvent,
  subscriptionRow,
} from '@/features/billing/subscription';

const USER = '11111111-1111-4111-8111-111111111111';
const DAY = 86_400_000;

function sub(overrides: Partial<Stripe.Subscription> = {}, lookupKey = 'apoiador_mensal'): Stripe.Subscription {
  return {
    id: 'sub_123',
    object: 'subscription',
    customer: 'cus_123',
    status: 'active',
    cancel_at: null,
    livemode: false,
    metadata: {},
    items: {
      object: 'list',
      data: [{ current_period_end: 1_800_000_000, price: { lookup_key: lookupKey } }],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe('assinatura Apoiador', () => {
  it('acha o plano pelo lookup key do preço', () => {
    expect(planFromLookupKey('apoiador_mensal')).toBe('monthly');
    expect(planFromLookupKey('apoiador_anual')).toBe('yearly');
    expect(planFromLookupKey('outro')).toBeNull();
    expect(planFromLookupKey(null)).toBeNull();
  });

  it('copia do Stripe a situação, o plano e o fim do período (que fica no item)', () => {
    expect(subscriptionRow(sub({ cancel_at: 1_800_000_000 }, 'apoiador_anual'), USER)).toEqual({
      id: 'sub_123',
      user_id: USER,
      customer_id: 'cus_123',
      status: 'active',
      plan: 'yearly',
      current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      cancel_at: new Date(1_800_000_000 * 1000).toISOString(),
      livemode: false,
    });
    expect(subscriptionRow(sub({ customer: { id: 'cus_obj' } as Stripe.Customer }), USER).customer_id).toBe('cus_obj');
  });

  it('conta como apoiador só ativa, em teste grátis ou com cobrança atrasada', () => {
    const future = new Date(Date.now() + 10 * DAY).toISOString();
    expect(isSupporter({ status: 'active', current_period_end: future })).toBe(true);
    expect(isSupporter({ status: 'trialing', current_period_end: future })).toBe(true);
    expect(isSupporter({ status: 'past_due', current_period_end: future })).toBe(true);
    for (const status of ['canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused']) {
      expect(isSupporter({ status, current_period_end: future })).toBe(false);
    }
    expect(isSupporter(null)).toBe(false);
  });

  it('se o aviso de cancelamento se perder, o selo cai 7 dias depois do fim do período', () => {
    const now = Date.now();
    const ended = (days: number) => new Date(now - days * DAY).toISOString();
    expect(isSupporter({ status: 'active', current_period_end: ended(6) }, now)).toBe(true);
    expect(isSupporter({ status: 'active', current_period_end: ended(8) }, now)).toBe(false);
  });

  it('entende os avisos do Stripe que mexem na assinatura e ignora o resto', () => {
    const checkout = {
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', subscription: 'sub_9', client_reference_id: USER } },
    } as unknown as Stripe.Event;
    expect(subscriptionFromEvent(checkout)).toEqual({ subscriptionId: 'sub_9', userHint: USER });

    const payment = {
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', subscription: null } },
    } as unknown as Stripe.Event;
    expect(subscriptionFromEvent(payment)).toBeNull();

    const updated = {
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_7' } },
    } as unknown as Stripe.Event;
    expect(subscriptionFromEvent(updated)).toEqual({ subscriptionId: 'sub_7', userHint: null });

    const invoice = { type: 'invoice.paid', data: { object: { id: 'in_1' } } } as unknown as Stripe.Event;
    expect(subscriptionFromEvent(invoice)).toBeNull();
  });

  it('mostra preço em reais e quantos meses o anual economiza', () => {
    expect(formatPrice(990, 'brl', 'pt-BR').replace(/\s/g, ' ')).toBe('R$ 9,90');
    expect(monthsSaved(990, 9900)).toBe(2);
    expect(monthsSaved(990, 11880)).toBe(0);
  });
});
