// Teste de fumaça na produção: cria uma conta temporária, passa pelos fluxos
// principais e EXCLUI a conta no fim (pela própria tela de exclusão).
// Não conecta a Battle.net de verdade: só confere se o botão leva ao login da Blizzard.
// Uso: node apps/web/scripts/smoke-production.mjs  (BASE_URL opcional)
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'https://wowhelp.vercel.app';
const email = `qa-smoke-${Date.now()}@wowhelp.test`;
const password = `Smoke${Date.now()}`;
const observed = Math.floor(Date.now() / 1000) - 600;
// Arquivo de TESTE no formato do addon (montarias 6 e 7 do catálogo oficial).
const addonFile = `WoWHelpCompanionDB = {
["schemaVersion"] = 1, ["addonVersion"] = "0.1.0", ["lastObservedAt"] = ${observed}, ["region"] = "us",
["account"] = { ["mounts"] = { ["available"] = true, ["observedAt"] = ${observed}, ["collected"] = { 6, 7 } } },
["characters"] = { ["Player-1-0000000A"] = { ["name"] = "Smoketest", ["realm"] = "Test", ["level"] = 10 } },
}`;

const steps = [];
const step = async (name, fn) => {
  const t0 = Date.now();
  try {
    await fn();
    steps.push(`ok   ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    steps.push(`FALHA ${name}: ${e.message.split('\n')[0]}`);
    throw e;
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
let created = false;
try {
  await step('home pública', async () => {
    const res = await page.goto(`${base}/en`);
    if (res.status() !== 200) throw new Error(`status ${res.status()}`);
  });
  await step('cadastro', async () => {
    await page.goto(`${base}/en/signup`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
    created = true;
  });
  await step('objetivo', async () => {
    await page.getByLabel('New goal').fill('Smoke test goal');
    await page.getByRole('button', { name: 'Add goal' }).click();
    await page.getByRole('article', { name: 'Smoke test goal' }).waitFor();
  });
  await step('botão da Battle.net leva à Blizzard', async () => {
    await page.goto(`${base}/en/characters`);
    await page.getByRole('button', { name: 'Connect Battle.net' }).click();
    await page.waitForURL(/battle\.net/, { timeout: 30_000 });
    if (!new URL(page.url()).hostname.endsWith('battle.net')) throw new Error(page.url());
  });
  await step('importação do addon', async () => {
    await page.goto(`${base}/en/import`);
    const input = page.getByLabel('Choose the WoWHelpCompanion.lua file');
    await page.waitForFunction(() => !document.querySelector('input[type=file]')?.disabled);
    await input.setInputFiles({ name: 'WoWHelpCompanion.lua', mimeType: 'text/plain', buffer: Buffer.from(addonFile) });
    await page.getByText('2 mounts collected').waitFor();
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.getByText('Import complete').waitFor({ timeout: 30_000 });
  });
  await step('montarias coletadas pelo addon', async () => {
    await page.goto(`${base}/en/mounts`);
    await page.getByLabel('My collection').selectOption('collected');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.getByText('2 mounts', { exact: true }).waitFor({ timeout: 20_000 });
  });
  await step('exportar dados', async () => {
    const res = await page.request.get(`${base}/api/account/export`);
    const body = await res.json();
    if (body.account?.email !== email || body.data?.goals?.length !== 1) throw new Error('conteúdo inesperado');
  });
  await step('excluir conta', async () => {
    await page.goto(`${base}/en/settings`);
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await page.getByLabel('To confirm, type the account email').fill(email);
    await page.getByRole('button', { name: 'Delete forever' }).click();
    await page.waitForURL(/account-deleted$/, { timeout: 30_000 });
    created = false;
  });
} finally {
  console.log(steps.join('\n'));
  if (created) console.log(`ATENÇÃO: a conta ${email} ficou criada; apague no Supabase.`);
  await browser.close();
}
