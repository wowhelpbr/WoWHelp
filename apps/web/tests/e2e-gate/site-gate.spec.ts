import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// Site privado com senha definida na administração. Roda depois de todos os
// outros testes (projeto "gate" no playwright.config), porque fecha o site inteiro.

function adminClient() {
  const env = Object.fromEntries(
    readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1]!, m[2]!.replace(/^"|"$/g, '')]),
  );
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.beforeAll(async () => {
  // Começa do zero: aberto e sem senha.
  await adminClient()
    .from('site_settings')
    .update({ private: false, password_hash: null, password_salt: null, password_iterations: null })
    .eq('id', true);
});

test.afterAll(async () => {
  // Sempre reabre o site no fim, mesmo se o teste falhar.
  await adminClient().from('site_settings').update({ private: false }).eq('id', true);
});

test('administrador fecha o site com senha e visitante precisa dela', async ({ page, browser }) => {
  test.setTimeout(90_000);
  const email = `e2e-site-${Date.now()}@wowhelp.test`;
  await page.goto('/pt-br/signup');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  await admin.from('app_admins').insert({ user_id: data.users.find((u) => u.email === email)!.id });

  await page.goto('/pt-br/admin/site');
  await expect(page.getByText('Agora: aberto ao público')).toBeVisible();
  // Privado sem senha é recusado.
  await page.getByLabel('Site privado').check();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Para deixar o site privado, defina uma senha.');
  await page.getByLabel('Nova senha').fill('SenhaDeTeste1');
  await page.getByLabel('Repita a senha').fill('SenhaDeTeste1');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('o site está privado');

  // Quem salvou continua entrando.
  await page.goto('/pt-br/mounts');
  await expect(page).toHaveURL(/\/pt-br\/mounts$/);

  // Visitante novo cai na senha (o servidor pode levar até 30 s para ler a mudança).
  const visitor = await browser.newContext();
  const v = await visitor.newPage();
  await expect(async () => {
    await v.goto('/pt-br/mounts');
    await expect(v).toHaveURL(/\/pt-br\/gate\?next=%2Fpt-br%2Fmounts/, { timeout: 2_000 });
  }).toPass({ timeout: 40_000 });
  await v.getByLabel('Senha').fill('errada123');
  await v.getByRole('button', { name: 'Entrar' }).click();
  await expect(v.getByText('Senha errada. Tente de novo.')).toBeVisible();
  await v.getByLabel('Senha').fill('SenhaDeTeste1');
  await v.getByRole('button', { name: 'Entrar' }).click();
  await expect(v).toHaveURL(/\/pt-br\/mounts$/);
  await visitor.close();

  // Abrir de novo.
  await page.goto('/pt-br/admin/site');
  await page.getByLabel('Site privado').uncheck();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('aberto ao público');
});
