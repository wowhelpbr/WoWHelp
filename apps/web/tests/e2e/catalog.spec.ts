import { expect, test, type Page } from '@playwright/test';

// Fase 3 contra a Battle.net falsa: a rota agendada importa duas montarias de
// teste; o catálogo mostra, busca, cruza com a coleção e vira objetivo.

test.beforeAll(async ({ request }) => {
  const denied = await request.post('/api/cron/catalog-sync');
  expect(denied.status()).toBe(401);
  const res = await request.post('/api/cron/catalog-sync?batch=50', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.total).toBe(2);
  // Imagens oficiais: a 6 tem modelo com imagem; a 7 não tem modelo (fica com o ícone padrão).
  const media = await request.post('/api/cron/catalog-sync?job=media&batch=10', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  });
  expect(media.ok()).toBe(true);
});

async function signUp(page: Page) {
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(`e2e-cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
}

test('catálogo público em inglês e português, com busca e crédito à Blizzard', async ({ page }) => {
  await page.goto('/en/mounts');
  await expect(page.getByRole('link', { name: /Test Mount One/ })).toBeVisible();
  await expect(page.getByText('Mount data provided by Blizzard Entertainment', { exact: false })).toBeVisible();

  await page.getByLabel('Search mounts').fill('two');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page).toHaveURL(/q=two/);
  await expect(page.getByRole('link', { name: /Test Mount Two/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Mount One/ })).toHaveCount(0);

  await page.goto('/pt-br/mounts');
  await expect(page.getByRole('link', { name: /Montaria de Teste Um/ })).toBeVisible();
});

test('status cruza com a Battle.net e a montaria vira objetivo', async ({ page }) => {
  await signUp(page);

  // Antes de conectar: tudo desconhecido, nunca "não obtida".
  await page.goto('/en/mounts');
  const one = page.getByRole('link', { name: /Test Mount One/ });
  await expect(one.getByText('Unknown')).toBeVisible();

  // Conecta (a coleção falsa tem a montaria 6 = Test Mount One).
  await page.goto('/en/characters');
  await page.getByRole('button', { name: 'Connect Battle.net' }).click();
  await expect(page).toHaveURL(/bnet=connected/, { timeout: 20_000 });

  await page.goto('/en/mounts');
  await expect(page.getByRole('link', { name: /Test Mount One/ }).getByText('Collected')).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Mount Two/ }).getByText('Not collected')).toBeVisible();

  // Filtro por status.
  await page.getByLabel('My collection').selectOption('not_collected');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('link', { name: /Test Mount One/ })).toHaveCount(0);

  // Detalhe → objetivo.
  await page.getByRole('link', { name: /Test Mount Two/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Test Mount Two' })).toBeVisible();
  await expect(page.getByText('Another test mount.')).toBeVisible();
  await page.getByRole('button', { name: 'Make it a goal' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(page.getByRole('article', { name: 'Test Mount Two' })).toBeVisible();

  // Marcação manual vence a sincronização antiga e fica identificada.
  await page.goto('/en/mounts/7');
  await page.getByRole('button', { name: 'I already have it' }).click();
  await expect(page.getByText('Marked by you')).toBeVisible();
  await expect(page.getByText('Collected', { exact: true }).first()).toBeVisible();
});

test('montaria inexistente mostra aviso', async ({ page }) => {
  await page.goto('/en/mounts/999999');
  await expect(page.getByText('This mount is not in the catalog.')).toBeVisible();
});

test('card com imagem oficial guardada no Storage e janela de detalhes', async ({ page, request }) => {
  await page.goto('/en/mounts');
  const one = page.getByRole('link', { name: /Test Mount One/ });
  const img = one.locator('img');
  await expect(img).toHaveAttribute('src', /\/storage\/v1\/object\/public\/catalog-media\/mounts\/6\.webp\?v=/);
  const file = await request.get((await img.getAttribute('src'))!);
  expect(file.ok()).toBe(true);
  expect(file.headers()['content-type']).toContain('image/webp');
  await expect(page.getByRole('link', { name: /Test Mount Two/ }).locator('img')).toHaveCount(0);

  // Clique abre por cima da lista, com URL própria; Esc fecha e volta para a lista.
  await one.click();
  const dialog = page.getByRole('dialog', { name: 'Test Mount One' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/en\/mounts\/6$/);
  await expect(dialog.getByText('A mount used only in tests.')).toBeVisible();
  // O conteúdo da chance depende da curadoria (outros testes mexem nela); aqui basta a seção existir.
  await expect(dialog.getByText('Drop chance', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/mounts$/);

  // Botão fechar também volta.
  await page.getByRole('link', { name: /Test Mount Two/ }).click();
  await page.getByRole('dialog', { name: 'Test Mount Two' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Link direto abre a página inteira, sem janela.
  await page.goto('/en/mounts/6');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Test Mount One' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the catalog' })).toBeVisible();
});

test('importa mascotes e brinquedos oficiais e as imagens deles', async ({ request }) => {
  const auth = { Authorization: 'Bearer test-cron-secret' };
  const bad = await request.post('/api/cron/catalog-sync?kind=hats', { headers: auth });
  expect(bad.status()).toBe(400);
  for (const kind of ['pet', 'toy']) {
    const res = await request.post(`/api/cron/catalog-sync?kind=${kind}&batch=50`, { headers: auth });
    expect(res.ok()).toBe(true);
    expect((await res.json()).total).toBe(2);
    const media = await request.post(`/api/cron/catalog-sync?job=media&kind=${kind}&batch=10`, { headers: auth });
    expect(media.ok()).toBe(true);
    const body = await media.json();
    expect(body.failed).toBe(0);
  }
});
