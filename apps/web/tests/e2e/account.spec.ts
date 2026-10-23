import { expect, test, type Page } from '@playwright/test';

// Fase 6: páginas legais, exportar dados e excluir a conta (LGPD).

const PASSWORD = 'Azeroth2026';

async function signUp(page: Page) {
  const email = `e2e-conta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`;
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  return email;
}

test('páginas legais em rascunho, com links no rodapé e no cadastro', async ({ page }) => {
  await page.goto('/pt-br/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('Rascunho em revisão jurídica');
  await expect(page.getByText('Servidores nos Estados Unidos (Oregon).', { exact: false })).toBeVisible();

  await page.goto('/en/terms');
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeVisible();
  const legalNav = page.getByRole('navigation', { name: 'Legal documents' });
  await legalNav.getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);

  await page.goto('/en/signup');
  await expect(page.getByRole('main').getByRole('link', { name: 'terms of use' })).toHaveAttribute('href', '/en/terms');
});

test('exporta os dados da conta e só com login', async ({ page, request }) => {
  const anonymous = await request.get('/api/account/export');
  expect(anonymous.status()).toBe(401);

  const email = await signUp(page);
  await page.getByLabel('New goal').fill('Goal to export');
  await page.getByRole('button', { name: 'Add goal' }).click();
  await expect(page.getByRole('article', { name: 'Goal to export' })).toBeVisible();

  const res = await page.request.get('/api/account/export');
  expect(res.ok()).toBe(true);
  expect(res.headers()['content-disposition']).toMatch(/attachment; filename="wowhelp-dados-\d{4}-\d{2}-\d{2}\.json"/);
  expect(res.headers()['cache-control']).toContain('no-store');
  const body = await res.json();
  expect(body.format).toBe('wowhelp-account-export');
  expect(body.account.email).toBe(email);
  expect(body.data.goals.map((g: { title: string }) => g.title)).toEqual(['Goal to export']);
  expect(body.data.profiles).toHaveLength(1);

  await page.goto('/en/settings');
  await expect(page.getByRole('link', { name: 'Download my data' })).toHaveAttribute('href', '/api/account/export');
});

test('exclui a conta com confirmação pelo e-mail e não deixa entrar de novo', async ({ page }) => {
  const email = await signUp(page);
  await page.goto('/en/settings');
  await page.getByRole('button', { name: 'Delete my account' }).click();

  await page.getByLabel('To confirm, type the account email').fill('someone-else@wowhelp.test');
  await page.getByRole('button', { name: 'Delete forever' }).click();
  await expect(page.getByRole('region', { name: 'Privacy and data' }).getByRole('alert')).toHaveText(
    "The email you typed isn't this account's email.",
  );

  await page.getByLabel('To confirm, type the account email').fill(email.toUpperCase());
  await page.getByRole('button', { name: 'Delete forever' }).click();
  await expect(page).toHaveURL(/\/en\/account-deleted$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Your account was deleted' })).toBeVisible();

  // Sessão limpa: a área logada volta para o login.
  await page.goto('/en/dashboard');
  await expect(page).toHaveURL(/\/en\/login/);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('E-mail or password is incorrect.')).toBeVisible({ timeout: 15_000 });
});
