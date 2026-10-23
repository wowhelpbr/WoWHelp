import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Varredura automática WCAG 2.1 A/AA. Não substitui teste manual com leitor
// de tela, mas pega contraste, rótulos e estrutura quebrados.
const pages = [
  '/en',
  '/pt-br',
  '/en/mounts',
  '/pt-br/login',
  '/en/signup?focus=mounts',
  '/en/offline',
  '/en/nao-existe',
];

for (const path of pages) {
  test(`sem violações WCAG A/AA em ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    );
    expect(summary).toEqual([]);
  });
}

test('painel logado sem violações WCAG A/AA', async ({ page }) => {
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(`a11y-${Date.now()}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.getByLabel('New goal').fill('Accessibility check goal');
  await page.getByRole('button', { name: 'Add goal' }).click();
  const goal = page.getByRole('article', { name: 'Accessibility check goal' });
  await goal.getByPlaceholder('Next step').fill('First step');
  await goal.getByRole('button', { name: 'Add step' }).click();
  await expect(goal.getByText('First step')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary).toEqual([]);

  await page.goto('/en/settings');
  const settings = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(settings.violations.map((v) => v.id)).toEqual([]);
});
