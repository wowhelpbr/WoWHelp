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
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}/en`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
