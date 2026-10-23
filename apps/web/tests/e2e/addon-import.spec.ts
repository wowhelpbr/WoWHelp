import { expect, test, type Page } from '@playwright/test';

// Fase 5: o arquivo do addon (dados de TESTE, não de um personagem real) é
// lido sem executar Lua, mostrado na prévia e só gravado depois de confirmar.

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/cron/catalog-sync?batch=50', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  });
  expect(res.ok()).toBe(true);
});

function savedVariables(mountIds: number[]) {
  // Leitura de uma hora atrás: a lista completa do addon vale por 30 dias.
  const observed = Math.floor(Date.now() / 1000) - 3600;
  return `
WoWHelpCompanionDB = {
["schemaVersion"] = 1,
["addonVersion"] = "0.1.0",
["lastObservedAt"] = ${observed},
["region"] = "us",
["account"] = {
["mounts"] = {
["available"] = true,
["observedAt"] = ${observed},
["collected"] = {
${mountIds.map((id, i) => `${id}, -- [${i + 1}]`).join('\n')}
},
},
},
["characters"] = {
["Player-1234-0ABCDEF0"] = {
["name"] = "Addonmage",
["realm"] = "Test Realm",
["realmSlug"] = "TestRealm",
["level"] = 80,
["classId"] = 8,
["className"] = "Mage",
["faction"] = "Alliance",
["observedAt"] = ${observed},
},
},
}
`;
}

async function signUp(page: Page) {
  await page.goto('/en/signup');
  await page
    .getByLabel('E-mail')
    .fill(`e2e-addon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
}

async function upload(
  page: Page,
  text: string,
  name = 'WoWHelpCompanion.lua',
  label = 'Choose the WoWHelpCompanion.lua file',
) {
  const input = page.getByLabel(label);
  await expect(input).toBeEnabled();
  await input.setInputFiles({
    name,
    mimeType: 'text/plain',
    buffer: Buffer.from(text, 'utf8'),
  });
}

test('página exige login e oferece o addon para baixar', async ({ page, request }) => {
  await page.goto('/en/import');
  await expect(page).toHaveURL(/\/login/);

  await signUp(page);
  await page.goto('/en/import');
  const download = page.getByRole('link', { name: 'Download addon 0.1.0' });
  await expect(download).toHaveAttribute('href', '/downloads/WoWHelpCompanion-0.1.0.zip');
  const zip = await request.get('/downloads/WoWHelpCompanion-0.1.0.zip');
  expect(zip.ok()).toBe(true);
  expect((await zip.body()).subarray(0, 2).toString()).toBe('PK');
});

// O Next também tem um role=alert (anúncio de rota); o erro fica no painel de envio.
const uploadAlert = (page: Page, name = 'Upload file') => page.getByRole('region', { name }).getByRole('alert');

test('importa personagens e montarias, recusa repetição e apaga tudo', async ({ page }) => {
  await signUp(page);
  await page.goto('/en/import');
  await expect(page.getByText('No imports yet.')).toBeVisible();

  // Arquivos errados são recusados sem gravar nada.
  await upload(page, 'OutroAddonDB = { ["x"] = 1 }');
  await expect(uploadAlert(page)).toHaveText('This file belongs to another addon. Look for WoWHelpCompanion.lua.');
  await upload(page, 'WoWHelpCompanionDB = os.execute("x")');
  await expect(uploadAlert(page)).toContainText('The file contains code');
  await upload(page, savedVariables([6]), 'notes.txt');
  await expect(uploadAlert(page)).toContainText('Choose the addon .lua file');

  // Prévia antes de gravar.
  await upload(page, savedVariables([6]));
  await expect(page.getByRole('heading', { name: 'Check before importing' })).toBeVisible();
  await expect(page.getByText('Region: Americas & Oceania')).toBeVisible();
  await expect(page.getByText(/Addonmage · Level 80 · Mage/)).toBeVisible();
  await expect(page.getByText('1 mount collected')).toBeVisible();
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByText('Import complete')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('1 character updated')).toBeVisible();
  await expect(page.getByText('1 mount marked as collected')).toBeVisible();

  // A coleção do addon é lista completa: a montaria fora dela vira "não obtida".
  await page.getByRole('link', { name: 'See mounts' }).click();
  await expect(page.getByRole('link', { name: /Test Mount One/ }).getByText('Collected')).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Mount Two/ }).getByText('Not collected')).toBeVisible();

  await page.goto('/en/characters');
  const card = page.getByRole('listitem').filter({ hasText: 'Addonmage' });
  await expect(card.getByText('Companion addon')).toBeVisible();

  // Histórico e exclusão (com confirmação) devolvem a coleção para "desconhecido".
  await page.goto('/en/import');
  await expect(page.getByText(/1 character · 1 mount/)).toBeVisible();
  await page.getByRole('button', { name: 'Delete addon data' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByText('No imports yet.')).toBeVisible({ timeout: 15_000 });
  await page.goto('/en/mounts');
  await expect(page.getByRole('link', { name: /Test Mount One/ }).getByText('Unknown')).toBeVisible();
});

test('mesmo arquivo duas vezes é avisado na prévia e recusado', async ({ page }) => {
  await signUp(page);
  await page.goto('/pt-br/import');
  const file = savedVariables([6, 7]);
  const PT_LABEL = 'Escolher o arquivo WoWHelpCompanion.lua';
  await upload(page, file, undefined, PT_LABEL);
  await expect(page.getByText('2 montarias coletadas')).toBeVisible();
  // Importa só as montarias.
  await page.getByRole('checkbox', { name: /Personagens/ }).uncheck();
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await expect(page.getByText('Importação concluída')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('2 montarias marcadas como coletadas')).toBeVisible();
  await expect(page.getByText(/personagem atualizado/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Importar outro arquivo' }).click();
  await upload(page, file, undefined, PT_LABEL);
  await expect(page.getByText('Você já importou este mesmo arquivo.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await expect(uploadAlert(page, 'Enviar arquivo')).toHaveText('Este arquivo já foi importado.');
});
