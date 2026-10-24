import { expect, test } from '@playwright/test';

// Gamificação: XP pelo que se faz no site, nível no cabeçalho, conquistas e
// comemoração do que é novo (o que já foi visto fica no navegador).

test('passo e objetivo concluídos dão XP, conquista e comemoração', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(`e2e-xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

  // Começa no nível 1, sem conquistas.
  const journey = page.getByRole('region', { name: 'Your journey' });
  await expect(journey.getByText('Level 1 · Recruit')).toBeVisible();
  await expect(journey.getByText('0 of 13')).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: /^Level 1, Recruit: 0 of 100 XP/ })).toBeVisible();

  await page.getByLabel('New goal').fill('Get the phoenix');
  await page.getByRole('button', { name: 'Add goal' }).click();
  const goal = page.getByRole('article', { name: 'Get the phoenix' });
  await goal.getByPlaceholder('Next step').fill('Kill the boss');
  await goal.getByRole('button', { name: 'Add step' }).click();
  await goal.getByRole('checkbox', { name: /Kill the boss/ }).click();

  // +10 XP e a primeira conquista, comemorados uma vez.
  const toasts = page.getByRole('status').filter({ hasText: 'Achievement unlocked' });
  await expect(toasts).toContainText('First step', { timeout: 15_000 });
  await expect(page.getByRole('banner').getByRole('link', { name: /^Level 1, Recruit: 10 of 100 XP/ })).toBeVisible();
  await expect(journey.getByText('1 of 13')).toBeVisible();

  // Concluir o objetivo: +50 XP e a conquista "Mission accomplished".
  await goal.getByRole('button', { name: 'Complete' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Goal completed!' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('banner').getByRole('link', { name: /^Level 1, Recruit: 60 of 100 XP/ })).toBeVisible();
  await expect(journey.getByText('2 of 13')).toBeVisible();

  // Recarregar não comemora de novo.
  await page.reload();
  await expect(journey.getByText('2 of 13')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('status').filter({ hasText: 'Goal completed!' })).toHaveCount(0);
});
