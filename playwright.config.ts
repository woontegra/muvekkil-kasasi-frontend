import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'tr-TR',
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/
    },
    {
      name: 'responsive-quality',
      use: {
        ...devices['Desktop Chrome'],
        // Access token memory-only; storageState cookie yolu dar — her koşuda form login
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174'
      },
      testMatch: /responsive-quality\/.*\.spec\.ts/
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json'
      },
      dependencies: ['setup'],
      testIgnore: /global\.setup\.ts|login-inputs\.spec\.ts|cross-tenant-isolation\.spec\.ts|role-matrix\.spec\.ts|auth-session\.spec\.ts|tenant-isolation\.spec\.ts|responsive-quality\/|tahsilat-merkezi-table-layout\.spec\.ts|randevu-form-modal-layout\.spec\.ts|ofis-finans-duzeltme-layout\.spec\.ts/
    },
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login-inputs\.spec\.ts|tenant-isolation\.spec\.ts|auth-session\.spec\.ts|cross-tenant-isolation\.spec\.ts|role-matrix\.spec\.ts|tahsilat-merkezi-table-layout\.spec\.ts|randevu-form-modal-layout\.spec\.ts|ofis-finans-duzeltme-layout\.spec\.ts/
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json'
      },
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/
    }
  ]
})
