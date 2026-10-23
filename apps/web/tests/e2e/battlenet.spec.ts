import { expect, test, type Page } from '@playwright/test';

// Fase 2 de ponta a ponta contra a Battle.net falsa (tests/mocks/blizzard-mock.mjs):
// conectar, ver personagens e montarias, desconectar e conferir que tudo sumiu.

const password = 'Azeroth2026';

async function signUp(page: Page) {
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(`e2e-bnet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
}

test('conectar Battle.net traz personagens e montarias; desconectar apaga', async ({ page }) => {
  await signUp(page);

  // Painel antes: nada conectado.
  await expect(page.getByText('No characters linked yet', { exact: false })).toBeVisible();

  await page.goto('/en/characters');
  await expect(page.getByRole('heading', { level: 1, name: 'Characters' })).toBeVisible();
  await page.getByLabel('Game region').selectOption('us');
  await page.getByRole('button', { name: 'Connect Battle.net' }).click();

  // Ida e volta pela Battle.net falsa.
  await expect(page).toHaveURL(/\/en\/characters\?bnet=connected$/, { timeout: 20_000 });
  await expect(page.getByRole('status').filter({ hasText: 'Battle.net connected' })).toBeVisible();
  await expect(page.getByText('Connected as Tester#1234')).toBeVisible();
  await expect(page.getByText('1 mount collected')).toBeVisible();
  await expect(page.getByText('Testmage')).toBeVisible();
  await expect(page.getByText('Testwarrior')).toBeVisible();
  await expect(page.getByText('Data provided by Blizzard Entertainment.', { exact: false })).toBeVisible();

  // Painel depois: personagens aparecem.
  await page.goto('/en/dashboard');
  await expect(page.getByRole('region', { name: 'Characters' }).getByText('Testmage')).toBeVisible();

  // Desconectar apaga tudo que veio da Battle.net.
  await page.goto('/en/characters');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Disconnect' }).click();
  await expect(page.getByText('Testmage')).toHaveCount(0);
  await expect(page.getByText('No characters yet', { exact: false })).toBeVisible();
});

test('retorno com state errado é recusado', async ({ page }) => {
  await signUp(page);
  await page.goto('/api/connections/battlenet/callback?code=mock-code&state=forjado');
  await expect(page).toHaveURL(/\/characters\?bnet=expired$/);
  await expect(page.getByText('The connection took too long', { exact: false })).toBeVisible();
});

test('visitante não acessa personagens', async ({ page }) => {
  await page.goto('/pt-br/characters');
  await expect(page).toHaveURL(/\/pt-br\/login\?next=%2Fpt-br%2Fcharacters$/);
});
