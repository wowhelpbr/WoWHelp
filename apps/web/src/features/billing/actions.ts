'use server';

import { localeSchema } from '@wowhelp/shared';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAdminUser } from '@/features/admin/session';
import { getCurrentUser } from '@/features/auth/session';
import { LOCALE_PREFIX, routing } from '@/i18n/routing';
import { logEvent } from '@/lib/log';
import { getSiteUrl } from '@/lib/site-url';
import { getStripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMySupport, getPlanPrices, getSubscriptionsOpen } from './queries';
import { ensureCustomer } from './sync';

const planSchema = z.enum(['monthly', 'yearly']);

function localeOf(formData: FormData) {
  const parsed = localeSchema.safeParse(formData.get('locale'));
  const locale = parsed.success ? parsed.data : routing.defaultLocale;
  return { locale, prefix: LOCALE_PREFIX[locale] };
}

/** Abre a página de pagamento do Stripe para o plano escolhido. */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const { locale, prefix } = localeOf(formData);
  const back = (status?: string) => redirect(`${prefix}/supporter${status ? `?status=${status}` : ''}`);

  const user = await getCurrentUser();
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(`${prefix}/supporter`)}`);
  const plan = planSchema.safeParse(formData.get('plan'));
  const stripe = getStripe();
  if (!plan.success || !stripe) back('erro');

  const [open, admin, support] = await Promise.all([getSubscriptionsOpen(), getAdminUser(), getMySupport()]);
  if (!open && !admin) back();
  if (support?.active) back();

  let url: string | null = null;
  try {
    const prices = await getPlanPrices();
    if (!prices) throw new Error('prices');
    const customer = await ensureCustomer(stripe!, user!);
    const site = getSiteUrl();
    const session = await stripe!.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user!.id,
      line_items: [{ price: prices[plan.data!].priceId, quantity: 1 }],
      subscription_data: { metadata: { user_id: user!.id } },
      locale: locale === 'pt-BR' ? 'pt-BR' : 'en',
      allow_promotion_codes: true,
      success_url: `${site}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}&locale=${locale}`,
      cancel_url: `${site}${prefix}/supporter?status=cancelado`,
    });
    url = session.url;
    logEvent('supporter_checkout_started', { plan: plan.data! });
  } catch {
    logEvent('supporter_checkout_failed');
  }
  if (!url) back('erro');
  redirect(url!);
}

/** Abre a página do Stripe onde o apoiador troca o cartão, muda de plano ou cancela. */
export async function openPortalAction(formData: FormData): Promise<void> {
  const { locale, prefix } = localeOf(formData);
  const user = await getCurrentUser();
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(`${prefix}/settings`)}`);
  const stripe = getStripe();
  const { data } = await createAdminClient()
    .from('billing_customers')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle();

  let url: string | null = null;
  if (stripe && data) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: data.id as string,
        return_url: `${getSiteUrl()}${prefix}/settings`,
        locale: locale === 'pt-BR' ? 'pt-BR' : 'en',
      });
      url = session.url;
    } catch {
      logEvent('supporter_portal_failed');
    }
  }
  if (!url) redirect(`${prefix}/supporter?status=erro`);
  redirect(url!);
}
