import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

// Comunidade BR: curador cadastra, a tarefa agendada busca o "ao vivo" na
// Twitch e no YouTube falsos, o público vê; pedidos de entrada chegam ao curador.

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

async function signUp(page: Page, prefix: string) {
  const email = `e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`;
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  return email;
}

async function promote(email: string) {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((u) => u.email === email);
  await admin.from('app_admins').insert({ user_id: user!.id });
}

test('página pública e pedido exigem o básico', async ({ page }) => {
  await page.goto('/pt-br/community');
  await expect(page.getByRole('heading', { level: 1, name: 'Comunidade BR' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ao vivo agora' })).toBeVisible();
  await page.getByRole('link', { name: 'Você cria conteúdo de WoW? Peça para entrar' }).click();
  await expect(page).toHaveURL(/\/pt-br\/community\/join$/);
  await expect(page.getByRole('link', { name: 'Entrar ou criar conta' })).toBeVisible();
  await page.goto('/pt-br/admin/community');
  await expect(page).toHaveURL(/\/pt-br\/login/);
});

test('curador cadastra criador, ao vivo aparece e pedido chega', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'usa canais fixos da API falsa');
  test.setTimeout(90_000);
  // Começa do zero: canais de teste são únicos no banco.
  await adminClient().from('creators').delete().like('slug', 'criador-e2e%');

  const email = await signUp(page, 'comunidade');
  await promote(email);

  await page.goto('/pt-br/admin/community');
  await page.getByRole('link', { name: 'Novo criador' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Criador E2E');
  await page.getByLabel('Kick').fill('https://evil.com/x');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'O canal da Kick não está num formato reconhecido.',
  );

  await page.getByLabel('Kick').fill('kick.com/CanalKickTeste');
  await page.getByLabel('Twitch').fill('twitch.tv/StreamerTeste');
  await page.getByLabel('YouTube').fill('@canalteste');
  await page.getByLabel('Raide', { exact: true }).check();
  await page.getByLabel('Guias', { exact: true }).check();
  await page.getByLabel('Situação').selectOption('published');
  await page.getByLabel('Apresentação (português)').fill('Lives de raide e guias para quem está começando.');
  await page.getByLabel('Mostrar em Destaque').check();
  await page.getByLabel('Por que está em destaque (português)').fill('Melhor guia de raide da semana.');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Criador salvo.')).toBeVisible({ timeout: 15_000 });

  const sync = await request.post('/api/cron/community-sync', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  });
  expect(sync.ok()).toBe(true);
  expect(await sync.json()).toMatchObject({ twitch: 1, youtube: 1, kick: 1, live: 3, failed: 0 });

  await page.goto('/pt-br/community');
  const live = page.getByRole('region', { name: 'Ao vivo agora' });
  await expect(live.getByText('Raide de teste ao vivo')).toBeVisible();
  await expect(live.getByText('Live de teste no YouTube')).toBeVisible();
  await expect(live.getByText('42 espectadores')).toBeVisible();
  await expect(live.getByText('Live de teste na Kick')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Destaque' }).getByText('Melhor guia de raide da semana.'),
  ).toBeVisible();
  const card = page
    .getByRole('region', { name: 'Todos os criadores' })
    .getByRole('listitem')
    .filter({ hasText: 'Criador E2E' });
  await expect(card.getByRole('link', { name: /Twitch/ })).toHaveAttribute(
    'href',
    'https://www.twitch.tv/streamerteste',
  );
  await expect(card.getByRole('link', { name: /YouTube/ })).toHaveAttribute(
    'href',
    'https://www.youtube.com/@canalteste',
  );

  // Filtro por assunto.
  await page.getByRole('navigation', { name: 'Assuntos' }).getByRole('link', { name: 'Guias' }).click();
  await expect(page).toHaveURL(/tag=guias/);
  await expect(
    page.getByRole('region', { name: 'Todos os criadores' }).getByRole('heading', { name: 'Criador E2E' }),
  ).toBeVisible();

  // Pedido de entrada chega ao curador.
  // Ocultar e publicar direto da lista da curadoria.
  await page.goto('/pt-br/admin/community');
  const row = page.getByRole('listitem').filter({ hasText: 'Criador E2E' });
  await row.getByRole('button', { name: 'Ocultar' }).click();
  await expect(row.getByText('Oculto')).toBeVisible();
  await page.goto('/pt-br/community');
  await expect(page.getByRole('region', { name: 'Todos os criadores' }).getByText('Criador E2E')).toHaveCount(0);
  await page.goto('/pt-br/admin/community');
  await page.getByRole('listitem').filter({ hasText: 'Criador E2E' }).getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Criador E2E' }).getByText('Publicado')).toBeVisible();

  await page.goto('/pt-br/community/join');
  await page.getByLabel('Nome do canal ou como você é conhecido').fill('Canal Pedido E2E');
  await page.getByLabel('Links dos seus canais').fill('https://www.twitch.tv/pedidoe2e');
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await expect(page.getByText('Pedido enviado! Avisamos quando você entrar na lista.')).toBeVisible();

  await page.goto('/pt-br/admin/community');
  const req = page.getByRole('listitem').filter({ hasText: 'Canal Pedido E2E' });
  await expect(req.getByText('https://www.twitch.tv/pedidoe2e')).toBeVisible();
  await req.getByRole('button', { name: 'Marcar como atendido' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Canal Pedido E2E' })).toHaveCount(0);
});
