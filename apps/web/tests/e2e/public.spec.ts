import { expect, test } from '@playwright/test';

test.describe('páginas públicas', () => {
  test('home em inglês e português, com troca de idioma', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('What do you want to do today?');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');

    await page.getByRole('link', { name: /Português \(Brasil\)/ }).click();
    await expect(page).toHaveURL(/\/pt-br$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('O que você quer fazer hoje?');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('raiz redireciona conforme o idioma do navegador', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'pt-BR' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt-br$/);
    await context.close();
  });

  test('escolher objetivos leva ao cadastro com as escolhas', async ({ page }) => {
    await page.goto('/en');
    await page.getByText('Collect mounts', { exact: true }).click();
    await page.getByText('Organize weekly tasks', { exact: true }).click();
    await page.getByRole('button', { name: 'Create a free account' }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/en\/signup\?focus=mounts,weekly$/);
    await expect(page.getByText(/Collect mounts, Organize weekly tasks/)).toBeVisible();
  });

  test('catálogo credita a Blizzard e nunca mostra dado inventado', async ({ page }) => {
    await page.goto('/pt-br/mounts');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Montarias');
    await expect(page.getByText('fornecidos pela Blizzard Entertainment', { exact: false })).toBeVisible();
    // Ou a lista oficial importada, ou o aviso de importação: nunca uma lista de exemplo.
    await expect(
      page
        .getByText('O catálogo oficial está sendo importado')
        .or(page.getByRole('link', { name: /Montaria de Teste/ }).first()),
    ).toBeVisible();
  });

  test('páginas privadas mandam visitante para o login', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fdashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
  });

  test('404 localizado', async ({ page }) => {
    const response = await page.goto('/pt-br/pagina-que-nao-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página não existe');
  });

  test('manifest do PWA e service worker publicados', async ({ request }) => {
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest).toMatchObject({ name: 'WoWHelp', display: 'standalone', start_url: '/' });
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBe(true);
    expect(sw.headers()['cache-control']).toContain('no-store');
  });

  test('cabeçalhos de segurança presentes', async ({ request }) => {
    const res = await request.get('/en');
    const headers = res.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
