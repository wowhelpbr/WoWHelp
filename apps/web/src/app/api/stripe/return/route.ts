import { localeSchema } from '@wowhelp/shared';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/features/auth/session';
import { syncSubscription } from '@/features/billing/sync';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { getStripe } from '@/lib/stripe/client';

/**
 * Volta da página de pagamento do Stripe. Confere o pagamento na hora (sem
 * esperar o aviso do Stripe) e leva para a página do apoiador.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = localeSchema.safeParse(params.get('locale'));
  const prefix = LOCALE_PREFIX[parsed.success ? parsed.data : routing.defaultLocale];
  const sessionId = params.get('session_id') ?? '';

  let status = 'processando';
  const stripe = getStripe();
  const user = await getCurrentUser();
  if (stripe && user && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const subscription = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      // Só confere o pagamento da própria conta.
      if (session.client_reference_id === user.id && subscription) {
        await syncSubscription(stripe, subscription, user.id);
        if (session.status === 'complete') status = 'ok';
      }
    } catch {
      // O aviso do Stripe (webhook) resolve depois.
    }
  }
  return NextResponse.redirect(new URL(`${prefix}/supporter?status=${status}`, request.url), 303);
}
