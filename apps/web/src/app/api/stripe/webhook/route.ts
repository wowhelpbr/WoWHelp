import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { subscriptionFromEvent } from '@/features/billing/subscription';
import { syncSubscription } from '@/features/billing/sync';
import { logEvent } from '@/lib/log';
import { getStripe } from '@/lib/stripe/client';

/**
 * Avisos do Stripe (pagamento concluído, assinatura criada, renovada,
 * cancelada). Só aceita aviso assinado com STRIPE_WEBHOOK_SECRET. Erro
 * devolve 500 para o Stripe tentar de novo mais tarde.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'no_signature' }, { status: 400 });
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 });
  }

  const target = subscriptionFromEvent(event);
  if (!target) return NextResponse.json({ ok: true, ignored: event.type });
  try {
    const result = await syncSubscription(stripe, target.subscriptionId, target.userHint);
    logEvent('supporter_synced', { type: event.type, result });
    return NextResponse.json({ ok: true, result });
  } catch {
    logEvent('supporter_webhook_failed', { type: event.type });
    return NextResponse.json({ error: 'sync_failed' }, { status: 500 });
  }
}
