import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3100);

// E2E rodam contra o build de produção (`next start`), não o dev server.
// Os testes com conta exigem o Supabase local: `npx supabase start` na raiz.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // Cada cadastro custa ~1-5 s no Supabase local (hash de senha); mais workers só geram fila.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Fecha o site inteiro com senha: roda sozinho, depois de todos os outros.
    {
      name: 'gate',
      testDir: './tests/e2e-gate',
      dependencies: ['desktop', 'mobile'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } },
    },
  ],
  webServer: [
    {
      // Battle.net falsa: OAuth e API com dados de teste (tests/mocks/blizzard-mock.mjs).
      command: 'node tests/mocks/blizzard-mock.mjs',
      url: 'http://127.0.0.1:4010/health',
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: `npx next start -p ${port}`,
      url: `http://localhost:${port}/en`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        BATTLENET_CLIENT_ID: 'test-client',
        BATTLENET_CLIENT_SECRET: 'test-secret',
        BATTLENET_TEST_BASE_URL: 'http://127.0.0.1:4010',
        CRON_SECRET: 'test-cron-secret',
        // Twitch e YouTube falsos (mesmo servidor de teste).
        TWITCH_CLIENT_ID: 'test-twitch',
        TWITCH_CLIENT_SECRET: 'test-twitch-secret',
        TWITCH_TEST_BASE_URL: 'http://127.0.0.1:4010',
        YOUTUBE_API_KEY: 'test-youtube',
        YOUTUBE_TEST_BASE_URL: 'http://127.0.0.1:4010',
        KICK_CLIENT_ID: 'test-kick',
        KICK_CLIENT_SECRET: 'test-kick-secret',
        KICK_TEST_BASE_URL: 'http://127.0.0.1:4010',
      },
    },
  ],
});
