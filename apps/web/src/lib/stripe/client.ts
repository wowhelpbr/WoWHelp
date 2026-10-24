import 'server-only';
import Stripe from 'stripe';

// Stripe: pagamento da assinatura "WoWHelp Apoiador". A chave secreta fica
// só no servidor (STRIPE_SECRET_KEY). Chave sk_test_/rk_test_ = modo de teste
// (nada é cobrado); sk_live_/rk_live_ = dinheiro de verdade.

export type StripeMode = 'test' | 'live' | 'off';

export function stripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (/^(sk|rk)_live_\w+$/.test(key)) return 'live';
  if (/^(sk|rk)_test_\w+$/.test(key)) return 'test';
  return 'off';
}

// Em teste local, um desvio aponta para o Stripe falso (só aceita localhost).
function testServer(): Pick<Stripe.StripeConfig, 'host' | 'port' | 'protocol'> {
  const url = process.env.STRIPE_TEST_BASE_URL;
  const match = url?.match(/^http:\/\/(127\.0\.0\.1|localhost):(\d+)$/);
  return match ? { host: match[1], port: Number(match[2]), protocol: 'http' } : {};
}

let client: Stripe | null = null;

/** Cliente do Stripe, ou null se a chave não está configurada. */
export function getStripe(): Stripe | null {
  if (stripeMode() === 'off') return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, {
    ...testServer(),
    maxNetworkRetries: 2,
    timeout: 20_000,
    telemetry: false,
  });
  return client;
}
