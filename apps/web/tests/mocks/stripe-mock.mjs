// Stripe falso para os testes E2E (assinatura Apoiador), servido pelo mesmo
// servidor de teste (porta 4010). Só o que o site usa, guardado em memória.

const KEY = 'Bearer sk_test_e2e';
const PRICES = [
  {
    id: 'price_e2e_m',
    object: 'price',
    active: true,
    lookup_key: 'apoiador_mensal',
    unit_amount: 990,
    currency: 'brl',
    recurring: { interval: 'month' },
  },
  {
    id: 'price_e2e_y',
    object: 'price',
    active: true,
    lookup_key: 'apoiador_anual',
    unit_amount: 9900,
    currency: 'brl',
    recurring: { interval: 'year' },
  },
];

const state = { seq: 0, sessions: new Map(), subs: new Map() };
// Códigos únicos entre execuções (o banco local guarda os de rodadas anteriores).
const RUN = Date.now().toString(36);
const nextId = (prefix) => `${prefix}${RUN}x${++state.seq}`;

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};
const missing = (res, message) =>
  send(res, 404, { error: { type: 'invalid_request_error', code: 'resource_missing', message } });

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });

const subscription = (id, s) => ({
  id,
  object: 'subscription',
  customer: s.customer,
  status: s.status,
  cancel_at: null,
  livemode: false,
  metadata: s.metadata,
  items: {
    object: 'list',
    data: [{ id: `si_${id}`, current_period_end: s.periodEnd, price: PRICES.find((p) => p.id === s.price) }],
  },
});

/** Responde se a rota é do Stripe falso; devolve false se não for. */
export async function stripeRoute(req, res, url, port) {
  const path = url.pathname;
  if (!path.startsWith('/v1/') && !path.startsWith('/stripe/')) return false;

  // Ajudantes só do teste: ver e cancelar assinaturas.
  if (path === '/stripe/_subscriptions') {
    send(
      res,
      200,
      [...state.subs].map(([id, s]) => subscription(id, s)),
    );
    return true;
  }
  const cancel = path.match(/^\/stripe\/_cancel\/(sub_\w+)$/);
  if (cancel && req.method === 'POST') {
    const sub = state.subs.get(cancel[1]);
    if (!sub) {
      missing(res, 'No such subscription');
      return true;
    }
    sub.status = 'canceled';
    send(res, 200, subscription(cancel[1], sub));
    return true;
  }

  // "Página de pagamento": paga na hora e volta para o site.
  const checkout = path.match(/^\/stripe\/checkout\/(cs_test_\w+)$/);
  if (checkout) {
    const session = state.sessions.get(checkout[1]);
    if (!session) {
      missing(res, 'No such checkout session');
      return true;
    }
    const subId = nextId('sub_e2e');
    const yearly = session.price === 'price_e2e_y';
    state.subs.set(subId, {
      customer: session.customer,
      status: 'active',
      price: session.price,
      metadata: session.metadata,
      periodEnd: Math.floor(Date.now() / 1000) + (yearly ? 365 : 30) * 86_400,
    });
    session.subscription = subId;
    session.status = 'complete';
    res.writeHead(303, { Location: session.success_url.replace('{CHECKOUT_SESSION_ID}', session.id) });
    res.end();
    return true;
  }
  if (path === '/stripe/portal') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><title>Portal de teste</title><h1>Portal de teste do Stripe</h1>');
    return true;
  }

  // API (precisa da chave de teste).
  if ((req.headers.authorization ?? '') !== KEY) {
    send(res, 401, { error: { type: 'invalid_request_error', message: 'Invalid API Key provided' } });
    return true;
  }
  const form = new URLSearchParams(req.method === 'POST' ? await readBody(req) : '');

  if (path === '/v1/prices' && req.method === 'GET') {
    send(res, 200, { object: 'list', data: PRICES, has_more: false, url: '/v1/prices' });
    return true;
  }
  if (path === '/v1/customers' && req.method === 'POST') {
    send(res, 200, { id: nextId('cus_e2e'), object: 'customer', livemode: false, email: form.get('email') });
    return true;
  }
  if (path === '/v1/checkout/sessions' && req.method === 'POST') {
    const id = nextId('cs_test_e2e');
    const session = {
      id,
      object: 'checkout.session',
      mode: 'subscription',
      status: 'open',
      customer: form.get('customer'),
      client_reference_id: form.get('client_reference_id'),
      price: form.get('line_items[0][price]'),
      metadata: { user_id: form.get('subscription_data[metadata][user_id]') },
      success_url: form.get('success_url'),
      cancel_url: form.get('cancel_url'),
      subscription: null,
      url: `http://127.0.0.1:${port}/stripe/checkout/${id}`,
    };
    state.sessions.set(id, session);
    send(res, 200, session);
    return true;
  }
  const sessionGet = path.match(/^\/v1\/checkout\/sessions\/(cs_test_\w+)$/);
  if (sessionGet) {
    const session = state.sessions.get(sessionGet[1]);
    if (!session) {
      missing(res, 'No such checkout session');
      return true;
    }
    send(res, 200, session);
    return true;
  }
  const subPath = path.match(/^\/v1\/subscriptions\/(sub_\w+)$/);
  if (subPath) {
    const sub = state.subs.get(subPath[1]);
    if (!sub) {
      missing(res, 'No such subscription');
      return true;
    }
    if (req.method === 'DELETE') sub.status = 'canceled';
    send(res, 200, subscription(subPath[1], sub));
    return true;
  }
  if (path === '/v1/billing_portal/sessions' && req.method === 'POST') {
    send(res, 200, { id: 'bps_e2e', object: 'billing_portal.session', url: `http://127.0.0.1:${port}/stripe/portal` });
    return true;
  }
  missing(res, `Unrecognized request URL (${req.method}: ${path})`);
  return true;
}
