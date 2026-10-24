import { expect, test } from '@playwright/test';

// Anúncios no modelo do Wowhead, com aviso de cookies (LGPD). O build normal
// não tem AdSense; para testar ligado, gere o build com
// NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000 (e os blocos) e rode com a mesma variável.
const enabled = /^ca-pub-\d{16}$/.test(process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '');

test('sem AdSense: nenhum aviso de cookies, anúncio ou ads.txt', async ({ page, request }) => {
  test.skip(enabled, 'build com anúncios ligados');
  await page.goto('/pt-br/mounts');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Cookies e anúncios' })).toHaveCount(0);
  await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
  expect((await request.get('/ads.txt')).status()).toBe(404);
});

test('com AdSense: escolha de cookies antes de carregar e anúncio identificado', async ({ page, request }) => {
  test.skip(!enabled, 'build sem anúncios');
  // O script do Google não é baixado no teste.
  await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort());
  await page.goto('/pt-br/mounts');
  const banner = page.getByRole('region', { name: 'Cookies e anúncios' });
  await expect(banner).toBeVisible();
  await expect(page.locator('#adsense-script')).toHaveCount(0);

  await banner.getByRole('button', { name: 'Só o necessário' }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator('#adsense-script')).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { adsbygoogle: { requestNonPersonalizedAds?: number } }).adsbygoogle
          .requestNonPersonalizedAds,
    ),
  ).toBe(1);
  await expect(page.getByRole('complementary', { name: 'Publicidade' }).first()).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === 'wowhelp_consent')?.value).toBe('essential');

  // Rodapé reabre a escolha.
  await page.getByRole('button', { name: 'Preferências de cookies' }).click();
  await expect(page.getByRole('region', { name: 'Cookies e anúncios' })).toBeVisible();

  const ads = await request.get('/ads.txt');
  expect(await ads.text()).toBe('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n');
  expect((await request.get('/pt-br')).headers()['content-security-policy']).toContain('pagead2.googlesyndication.com');
});
