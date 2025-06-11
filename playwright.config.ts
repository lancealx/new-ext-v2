import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'chrome-extension://extension-id/', // Will be replaced with actual ID during tests
    trace: 'on-first-retry',
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-extensions-except=./dist',
            '--load-extension=./dist',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run build',
    port: 8888, // Arbitrary port, not actually used
    reuseExistingServer: !process.env.CI,
  },
}); 