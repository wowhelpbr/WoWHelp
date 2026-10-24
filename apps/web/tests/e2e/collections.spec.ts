import { expect, test, type Page } from '@playwright/test';

// Mascotes e brinquedos: catálogo público com abas, imagem/ícone, janela e
// status da coleção pela Battle.net falsa (dados de TESTE).

test.beforeAll(async ({ request }) => {
  const auth = { Authorization: 'Bearer test-cron-secret' };
  for (const kind of ['pet', 'toy']) {
    expect((await request.post(`/api/cron/catalog-sync?kind=${kind}&batch=50`, { headers: auth })).ok()).toBe(true);
    expect((await request.post(`/api/cron/catalog-sync?job=media&kind=${kind}&batch=10`, { headers: auth })).ok()).toBe(
      true,
    );
  }
});

async function signUp(page: Page) {
  await page.goto('/en/signup');
  await page
    .getByLabel('E-mail')
    .fill(`e2e-colecoes-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
}

test('abas entre os catálogos e mascotes com tipo, imagem e janela', async ({ page }) => {
  await page.goto('/en/mounts');
  const tabs = page.getByRole('navigation', { name: 'Collection types' });
  await tabs.getByRole('link', { name: 'Pets' }).click();
  await expect(page).toHaveURL(/\/en\/pets$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Pet catalog' })).toBeVisible();
  await expect(tabs.getByRole('link', { name: 'Pets' })).toHaveAttribute('aria-current', 'page');

  const one = page.getByRole('link', { name: /Test Pet One/ });
  await expect(one.getByText('Beast · Vendor')).toBeVisible();
  await expect(one.locator('img')).toHaveAttribute('src', /catalog-media\/pets\/39\.webp/);

  // Filtro por tipo.
  await page.getByLabel('Family').selectOption('CRITTER');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('link', { name: /Test Pet Two/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Pet One/ })).toHaveCount(0);

  await page.getByRole('link', { name: /Test Pet Two/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Test Pet Two' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/en\/pets\/40$/);
  await expect(dialog.getByText('Alliance only', { exact: false })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.goto('/pt-br/toys/1131');
  await expect(page.getByText('Uso: Invoca um balão de teste.')).toBeVisible();
  await page.goto('/pt-br/toys');
  await expect(page.getByRole('heading', { level: 1, name: 'Catálogo de brinquedos' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Brinquedo de Teste Um/ }).locator('img')).toHaveAttribute(
    'src',
    /catalog-media\/toys\/1131\.webp/,
  );
});

test('coleção de mascotes e brinquedos pela Battle.net e marcação manual', async ({ page }) => {
  test.setTimeout(60_000);
  await signUp(page);
  await page.goto('/en/pets');
  await expect(page.getByRole('link', { name: /Test Pet One/ }).getByText('Unknown')).toBeVisible();

  await page.goto('/en/characters');
  await page.getByRole('button', { name: 'Connect Battle.net' }).click();
  await expect(page).toHaveURL(/bnet=connected/, { timeout: 20_000 });

  await page.goto('/en/pets');
  await expect(page.getByRole('link', { name: /Test Pet One/ }).getByText('Collected')).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Pet Two/ }).getByText('Not collected')).toBeVisible();
  await page.goto('/en/toys');
  await expect(page.getByRole('link', { name: /Test Toy Two/ }).getByText('Collected')).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Toy One/ }).getByText('Not collected')).toBeVisible();

  // Marcação manual e objetivo a partir de um brinquedo.
  await page.goto('/en/toys/1131');
  await page.getByRole('button', { name: 'I already have it' }).click();
  await expect(page.getByText('Marked by you')).toBeVisible();
  await page.getByRole('button', { name: 'Make it a goal' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(page.getByRole('article', { name: 'Test Toy One' })).toBeVisible();
});
