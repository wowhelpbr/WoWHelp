// Gera capturas de tela para documentação e revisão visual.
// Uso: com o app em http://localhost:3100 e Supabase local ativo,
//   node apps/web/scripts/screenshots.mjs
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.BASE_URL ?? 'http://localhost:3100';
const out = new URL('../../../docs/screenshots/', import.meta.url);
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const viewports = {
  desktop: { viewport: { width: 1366, height: 900 } },
  mobile: devices['Pixel 7'],
};

for (const [name, options] of Object.entries(viewports)) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const shot = async (file) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(900);
    await page.screenshot({
      path: new URL(`${name}-${file}.jpg`, out).pathname.slice(1),
      fullPage: true,
      animations: 'disabled',
      type: 'jpeg',
      quality: 78,
    });
    console.log('ok', `${name}-${file}.jpg`);
  };

  await page.goto(`${base}/en`);
  await page.getByText('Collect mounts', { exact: true }).click();
  await page.getByText('Plan a play session', { exact: true }).click();
  await shot('home-en');
  await page.goto(`${base}/pt-br`);
  await shot('home-pt-br');
  await page.goto(`${base}/pt-br/mounts`);
  await shot('mounts-pt-br');
  await page.goto(`${base}/en/signup?focus=mounts,sessions`);
  await shot('signup-en');

  await page.getByLabel('E-mail').fill(`shots-${name}-${Date.now()}@wowhelp.test`);
  await page.getByLabel('Password', { exact: true }).fill('Azeroth2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/dashboard/);
  for (const [title, steps] of [
    ['Get a flying mount this week', ['Check what the mount requires', 'Save gold for the purchase']],
    ['Try the new delves with my alt', []],
  ]) {
    await page.getByLabel('New goal').fill(title);
    await page.getByRole('button', { name: 'Add goal' }).click();
    const goal = page.getByRole('article', { name: title });
    await goal.waitFor();
    for (const step of steps) {
      await goal.getByPlaceholder('Next step').fill(step);
      await goal.getByRole('button', { name: 'Add step' }).click();
      await goal.getByText(step).waitFor();
    }
  }
  await page
    .getByRole('article', { name: 'Get a flying mount this week' })
    .getByRole('checkbox', { name: /Check what the mount requires/ })
    .click();
  await page.waitForTimeout(600);
  await shot('dashboard-en');
  await page.goto(`${base}/pt-br/dashboard`);
  await shot('dashboard-pt-br');
  await context.close();
}

await browser.close();
