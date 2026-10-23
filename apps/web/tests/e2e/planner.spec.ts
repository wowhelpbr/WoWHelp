import { expect, test } from '@playwright/test';

// Fase 4: tarefas recorrentes, passos com tempo e montagem da sessão.

test('planejador monta a sessão e a conclusão vale até o reset', async ({ page }) => {
  await page.goto('/en/signup');
  await page.getByLabel('E-mail').fill(`e2e-plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

  // Objetivo com um passo de 15 min.
  await page.getByLabel('New goal').fill('Farm reputation');
  await page.getByRole('button', { name: 'Add goal' }).click();
  const goal = page.getByRole('article', { name: 'Farm reputation' });
  await goal.getByPlaceholder('Next step').fill('Do the world quests');
  await goal.getByLabel('Estimated time').selectOption('15');
  await goal.getByRole('button', { name: 'Add step' }).click();
  await expect(goal.getByRole('listitem').filter({ hasText: 'Do the world quests' })).toContainText('15 min');

  // Tarefa semanal de 5 min e uma sem estimativa.
  await page.goto('/en/planner');
  await expect(page.getByRole('heading', { level: 1, name: 'Planner' })).toBeVisible();
  await page.getByLabel('Task', { exact: true }).fill('Open the Great Vault');
  await page.getByLabel('Time', { exact: true }).selectOption('5');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('region', { name: 'Recurring tasks' }).getByText('Open the Great Vault')).toBeVisible();
  await page.getByLabel('Task', { exact: true }).fill('Check the auction house');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(
    page.getByRole('region', { name: 'Recurring tasks' }).getByText('Check the auction house'),
  ).toBeVisible();

  // Sessão de 15 min: só a tarefa de 5 cabe (5 + 15 passaria); a sem estimativa aparece à parte.
  await page.getByRole('link', { name: '15 min' }).click();
  await expect(page).toHaveURL(/m=15/);
  const session = page.getByRole('region', { name: 'Your session' });
  await expect(session.getByText('1 item · about 5 min')).toBeVisible();
  await expect(session.getByText('Without a time estimate', { exact: false })).toBeVisible();

  // Sessão de 30 min: tarefa (vence no reset) primeiro, depois o passo do objetivo.
  await page.getByRole('link', { name: '30 min' }).click();
  await expect(session.getByText('2 items · about 20 min')).toBeVisible();
  const items = session.getByRole('listitem');
  await expect(items.nth(0)).toContainText('Open the Great Vault');
  await expect(items.nth(1)).toContainText('Do the world quests');

  // Concluir a tarefa pela sessão: some do plano e fica marcada na lista até o reset.
  await session.getByRole('checkbox', { name: /Open the Great Vault/ }).click();
  await expect(session.getByText('1 item · about 15 min')).toBeVisible();
  await page.reload();
  const tasks = page.getByRole('region', { name: 'Recurring tasks' });
  await expect(tasks.getByRole('checkbox', { name: /Open the Great Vault/ })).toHaveAttribute('aria-checked', 'true');
  await expect(tasks.getByText('Done until the next reset', { exact: false })).toBeVisible();

  // Horário de reset mostrado com aviso de estimativa (Américas).
  await expect(page.getByText('Estimated time', { exact: false })).toBeVisible();
});
