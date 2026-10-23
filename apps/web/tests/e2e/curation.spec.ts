import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

// Curadoria: só administrador entra; chance de drop só com fonte; o público só
// vê depois de publicar. O administrador é promovido direto no banco local,
// como será feito em produção (nunca pelo site).

function localEnv(): Record<string, string> {
  const text = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1]!, m[2]!.replace(/^"|"$/g, '')]),
  );
}

function adminClient() {
  const env = localEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function promoteToAdmin(email: string) {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error('usuário de teste não encontrado');
  const { error: insertError } = await admin.from('app_admins').insert({ user_id: user.id });
  if (insertError) throw insertError;
}

async function signUp(page: Page) {
  const email = `e2e-curador-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`;
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  return email;
}

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/cron/catalog-sync?batch=50', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  });
  expect(res.ok()).toBe(true);
});

test('quem não é curador não vê a curadoria', async ({ page }) => {
  await page.goto('/en/admin');
  await expect(page).toHaveURL(/\/en\/login/);
  await signUp(page);
  // A checagem roda dentro do Suspense (carregamento em partes): a página
  // chega como "não encontrada" sem mostrar nada da curadoria.
  await page.goto('/en/admin/mounts');
  await expect(page.getByRole('heading', { name: "This page doesn't exist" })).toBeVisible();
  await expect(page.getByLabel('Search by name or number')).toHaveCount(0);
  await page.goto('/en/settings');
  await expect(page.getByRole('link', { name: 'Open curation' })).toHaveCount(0);
});

test('curador publica chance de drop com fonte e o público vê', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  // Computador e celular rodam juntos: cada um cura uma montaria, sempre do zero.
  const [id, name] = testInfo.project.name === 'mobile' ? ['7', 'Test Mount Two'] : ['6', 'Test Mount One'];
  await adminClient().from('collectible_guides').delete().eq('kind', 'mount').eq('external_item_id', id);
  const email = await signUp(page);
  await promoteToAdmin(email);

  await page.goto('/en/settings');
  await page.getByRole('link', { name: 'Open curation' }).click();
  await page.getByRole('link', { name: /Drop chance, where to get it/ }).click();
  await page.getByLabel('Search by name or number').fill(name);
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.getByRole('link', { name: new RegExp(name) }).click();

  // Chance sem fonte é recusada.
  await page.getByLabel('Chance (%)').fill('0,5');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Drop chance needs the source link.');

  await page.getByLabel('Note (English)').fill('Per boss kill, once a week');
  await page.getByLabel('Source link').fill('https://example.com/source');
  await page.getByLabel('Source name').fill('Test source');
  await page.getByLabel('Where (English)').fill('Test Zone, final boss');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Published. It now shows on the site.');

  await page.goto(`/en/mounts/${id}`);
  await expect(page.getByText('0.5%')).toBeVisible();
  await expect(page.getByText('Per boss kill, once a week')).toBeVisible();
  await expect(page.getByText('Test Zone, final boss')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Test source' })).toHaveAttribute('href', 'https://example.com/source');

  // Despublicar tira do site.
  await page.goto(`/en/admin/mounts/${id}`);
  await page.getByRole('button', { name: 'Unpublish' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText(
    'Unpublished. It left the site and became a draft.',
  );
  await page.goto(`/en/mounts/${id}`);
  await expect(page.getByText('Unknown: no reviewed source yet')).toBeVisible();
});

test('tentativas: mortes do chefe pela Battle.net aparecem na montaria', async ({ page }, testInfo) => {
  // Usa a montaria 6 e a Battle.net falsa; roda só no computador para não disputar dados com o celular.
  test.skip(testInfo.project.name !== 'desktop', 'só no computador');
  test.setTimeout(90_000);
  await adminClient().from('collectible_guides').delete().eq('kind', 'mount').eq('external_item_id', '6');
  const email = await signUp(page);
  await promoteToAdmin(email);

  await page.goto('/en/mounts/6');
  await expect(page.getByRole('heading', { name: 'Your attempts' })).toHaveCount(0);

  // Curador informa o chefe e a dificuldade.
  await page.goto('/en/admin/mounts/6');
  await page.getByLabel('Adventure Guide boss (ID)').fill('1234');
  await page.getByLabel('Boss difficulty').fill('heroic');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Published. It now shows on the site.');

  await page.goto('/en/mounts/6');
  await expect(page.getByText('Connect Battle.net to count how many times you killed this boss.')).toBeVisible();

  await page.goto('/en/characters');
  await page.getByRole('button', { name: 'Connect Battle.net' }).click();
  await expect(page).toHaveURL(/bnet=connected/, { timeout: 20_000 });

  // A busca roda depois da resposta: recarrega até aparecer (7 da raide + 2 da masmorra, heroico).
  await expect(async () => {
    await page.goto('/en/mounts/6');
    await expect(page.getByText('times you killed the boss (HEROIC) across 2 characters')).toBeVisible({
      timeout: 2_000,
    });
  }).toPass({ timeout: 30_000 });
  const attempts = page.getByRole('region', { name: 'Your attempts' });
  await expect(attempts.getByText('9', { exact: true })).toBeVisible();
  await expect(attempts.getByRole('listitem').filter({ hasText: 'Testmage' })).toContainText('7');
});
