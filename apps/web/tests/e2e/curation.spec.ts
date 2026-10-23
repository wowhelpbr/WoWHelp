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
