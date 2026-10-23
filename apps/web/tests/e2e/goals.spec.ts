import { expect, test, type Page } from '@playwright/test';

// Gate da Fase 1: usuário logado cria um objetivo, recarrega e mantém o
// progresso; outra conta não enxerga nada disso. Requer Supabase local.

const password = 'Azeroth2026';
const uniqueEmail = (who: string) => `e2e-${who}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`;

async function signUp(page: Page, email: string, path = '/en/signup') {
  await page.goto(path);
  await page.getByLabel('E-mail').fill(email);
  await page
    .getByLabel('Password', { exact: true })
    .or(page.getByLabel('Senha', { exact: true }))
    .fill(password);
  await page.getByRole('button', { name: /Create account|Criar conta/ }).click();
  // O cadastro passa pelo Supabase Auth; sob carga local pode levar alguns segundos.
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
}

test.describe('objetivos com conta', () => {
  test('cria objetivo e etapa, recarrega e mantém; outra conta não vê', async ({ browser }) => {
    const alice = await browser.newContext();
    const page = await alice.newPage();
    await signUp(page, uniqueEmail('alice'), '/en/signup?focus=mounts,weekly');

    // Escolhas da home chegam ao perfil.
    const focus = page.getByRole('region', { name: 'What you want to do' });
    await expect(focus.getByText('Collect mounts')).toBeVisible();
    await expect(focus.getByText('Organize weekly tasks')).toBeVisible();

    // Cria objetivo e etapa.
    await page.getByLabel('New goal').fill('Test goal for Alice');
    await page.getByRole('button', { name: 'Add goal' }).click();
    const goal = page.getByRole('article', { name: 'Test goal for Alice' });
    await expect(goal).toBeVisible();
    await goal.getByPlaceholder('Next step').fill('Talk to the quartermaster');
    await goal.getByRole('button', { name: 'Add step' }).click();
    await expect(goal.getByText('Talk to the quartermaster')).toBeVisible();

    // Marca a etapa e recarrega: o progresso continua lá.
    await goal.getByRole('checkbox', { name: /Talk to the quartermaster/ }).click();
    await expect(goal.getByRole('checkbox', { name: /Talk to the quartermaster/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(goal.getByText('1 of 1 steps').first()).toBeVisible();
    // Espera o servidor confirmar (o aviso "Saving…" some) antes de recarregar.
    await expect(goal).toHaveAttribute('aria-busy', 'false');
    await page.reload();
    const reloaded = page.getByRole('article', { name: 'Test goal for Alice' });
    await expect(reloaded.getByRole('checkbox', { name: /Talk to the quartermaster/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // Próximas ações mostra o objetivo ativo.
    await expect(page.getByRole('region', { name: 'Next actions' }).getByText('Test goal for Alice')).toBeVisible();

    // Outra conta, outro navegador: não vê nada da primeira.
    const bob = await browser.newContext();
    const bobPage = await bob.newPage();
    await signUp(bobPage, uniqueEmail('bob'), '/pt-br/signup');
    await expect(bobPage.getByRole('heading', { level: 1 })).toHaveText('Bom te ver de novo');
    await expect(bobPage.getByText('Test goal for Alice')).toHaveCount(0);
    await expect(bobPage.getByText('Nenhum objetivo ainda.', { exact: false })).toBeVisible();

    await alice.close();
    await bob.close();
  });

  test('concluir, filtrar e excluir objetivo', async ({ page }) => {
    await signUp(page, uniqueEmail('carol'));
    await page.getByLabel('New goal').fill('Finish the weekly vault');
    await page.getByRole('button', { name: 'Add goal' }).click();
    const goal = page.getByRole('article', { name: 'Finish the weekly vault' });
    await goal.getByRole('button', { name: 'Complete' }).click();

    // Sai da lista de ativos e aparece em concluídos.
    await expect(page.getByRole('article', { name: 'Finish the weekly vault' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Finish the weekly vault' })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page
      .getByRole('article', { name: 'Finish the weekly vault' })
      .getByRole('button', { name: 'Delete goal' })
      .click();
    await expect(page.getByRole('article', { name: 'Finish the weekly vault' })).toHaveCount(0);
  });

  test('sair encerra a sessão', async ({ page }) => {
    await signUp(page, uniqueEmail('dave'));
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/en$/);
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('login com senha errada mostra erro claro', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('E-mail').fill('nobody@wowhelp.test');
    await page.getByLabel('Password').fill('wrongpass1');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('E-mail or password is incorrect.')).toBeVisible();
  });
});
