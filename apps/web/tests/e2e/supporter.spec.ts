import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { expect, test, type APIRequestContext } from '@playwright/test';
import Stripe from 'stripe';

// Assinatura WoWHelp Apoiador com o Stripe falso (tests/mocks/stripe-mock.mjs).
// Muda a venda aberta/fechada (dado do site inteiro): só no projeto desktop.

const MOCK = 'http://127.0.0.1:4010';

function adminClient() {
  const env = Object.fromEntries(
    readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1]!, m[2]!.replace(/^"|"$/g, '')]),
  );
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sendWebhook(request: APIRequestContext, type: string, subscriptionId: string, signature?: string) {
  const payload = JSON.stringify({
    id: `evt_e2e_${Date.now()}`,
    object: 'event',
    type,
    livemode: false,
    data: { object: { id: subscriptionId, object: 'subscription' } },
  });
  const header =
    signature ?? new Stripe('sk_test_e2e').webhooks.generateTestHeaderString({ payload, secret: 'whsec_e2e' });
  return request.post('/api/stripe/webhook', {
    data: payload,
    headers: { 'stripe-signature': header, 'content-type': 'application/json' },
  });
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'muda a venda de assinaturas do site inteiro');
});

test.beforeAll(async () => {
  await adminClient().from('site_settings').update({ subscriptions_open: false }).eq('id', true);
});

test.afterAll(async () => {
  await adminClient().from('site_settings').update({ subscriptions_open: false }).eq('id', true);
});

test('venda fechada: visitante vê os preços e "Em breve", sem botão de assinar', async ({ page }) => {
  await page.goto('/pt-br/supporter');
  await expect(page.getByRole('heading', { level: 1, name: 'Seja apoiador do WoWHelp' })).toBeVisible();
  await expect(page.getByText('R$ 9,90')).toBeVisible();
  await expect(page.getByText('Equivale a 2 meses grátis')).toBeVisible();
  await expect(page.getByText('A assinatura abre em breve.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /Assinar/ })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-ads', 'on');
});

test('administrador assina, fica sem anúncios, gerencia, abre a venda e o cancelamento volta tudo', async ({
  page,
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const email = `e2e-apoiador-${Date.now()}@wowhelp.test`;
  await page.goto('/pt-br/signup');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const userId = data.users.find((u) => u.email === email)!.id;
  await admin.from('app_admins').insert({ user_id: userId });

  // Venda fechada, mas o administrador testa.
  await page.goto('/pt-br/supporter');
  await expect(page.getByText('Venda fechada ao público', { exact: false })).toBeVisible();
  await expect(page.getByText('Modo de teste: nada é cobrado.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Assinar o anual' }).click();

  // Paga no "Stripe" e volta.
  await expect(page).toHaveURL(/\/pt-br\/supporter\?status=ok$/, { timeout: 20_000 });
  const main = page.getByRole('main');
  await expect(main.getByRole('status')).toContainText('Pagamento recebido');
  await expect(main.getByRole('heading', { name: 'Você é apoiador. Obrigado!' })).toBeVisible();
  await expect(main.getByText('Plano anual.', { exact: false })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-ads', 'off');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Apoiador' })).toBeVisible();

  // Configurações mostram a assinatura e levam ao portal do Stripe.
  await page.goto('/pt-br/settings');
  const panel = page.getByRole('region', { name: 'Assinatura' });
  await expect(panel).toContainText('Você é apoiador. Obrigado!');
  await panel.getByRole('button', { name: 'Gerenciar assinatura' }).click();
  await expect(page).toHaveURL(`${MOCK}/stripe/portal`);

  // Administração: modo de teste, a conta na lista e a venda aberta ao público.
  await page.goto('/pt-br/admin/supporters');
  await expect(page.getByText('Stripe em modo de teste (nada é cobrado)')).toBeVisible();
  await expect(page.getByText('Preços no Stripe: mensal R$ 9,90, anual R$ 99,00')).toBeVisible();
  await expect(page.getByRole('cell', { name: email })).toBeVisible();
  await page.getByLabel('Venda aberta ao público').check();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Salvo: a venda está aberta ao público.');

  // Visitante sem conta vê os botões pedindo para entrar.
  const visitor = await browser.newContext();
  const v = await visitor.newPage();
  await v.goto('/pt-br/supporter');
  await expect(v.getByRole('link', { name: 'Entre para apoiar' })).toHaveCount(2);
  await visitor.close();

  // Aviso do Stripe sem assinatura válida é recusado.
  const subs = (await (await request.get(`${MOCK}/stripe/_subscriptions`)).json()) as Array<{
    id: string;
    metadata: { user_id: string };
  }>;
  const sub = subs.find((s) => s.metadata.user_id === userId)!;
  expect((await sendWebhook(request, 'customer.subscription.deleted', sub.id, 't=1,v1=00')).status()).toBe(400);

  // Cancelada no Stripe: o aviso tira o selo e os anúncios voltam.
  await request.post(`${MOCK}/stripe/_cancel/${sub.id}`);
  const res = await sendWebhook(request, 'customer.subscription.deleted', sub.id);
  expect(res.status()).toBe(200);
  await page.goto('/pt-br/supporter');
  await expect(page.getByRole('button', { name: 'Assinar o anual' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-ads', 'on');
  await expect(page.getByRole('banner').getByRole('link', { name: 'Apoiador' })).toHaveCount(0);
});
