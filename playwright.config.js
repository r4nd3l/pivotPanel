import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_PATH = '/pivotPanel/'
const productionURL = process.env.E2E_BASE_URL?.replace(/\/?$/, '/')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: productionURL ?? `http://127.0.0.1:${PORT}${BASE_PATH}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: productionURL ? 'production' : 'local',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(productionURL
    ? {}
    : {
        webServer: {
          command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT}`,
          url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
})
