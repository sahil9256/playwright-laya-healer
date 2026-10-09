import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.ENV || 'prod';
dotenv.config({ path: path.resolve(__dirname, `env/.env.${environment}`) });
// Optional, git-ignored: demo switches such as SIMULATE_UI_CHANGE (see tests/pages/base.ts).
dotenv.config({ path: path.resolve(__dirname, 'env/.env.simulate.local'), quiet: true });

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  retryStrategy: 'isolated',
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
      ['blob'],
      ['github'],
      ['list'],
    ]
    : [
      ['html', { open: 'never' }],
      ['list'],
      ['json', { outputFile: 'test-results/results.json' }],
    ],
  snapshotDir: 'snapshots',
  snapshotPathTemplate: 'snapshots/aria/{testFileName}-snapshots/{arg}{ext}',
  expect: {
    toMatchAriaSnapshot: {
      pathTemplate: 'snapshots/aria/{testFileName}-snapshots/{arg}{ext}',
    },
  },
  use: {
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: ['geolocation'],
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],       
    },
  },
  projects: [
    {
      name: 'toolshop-e2e',
      testDir: './tests/spec',
      testIgnore: ['**/spec/api/**', '**/api/**', '**/sanity/**', '**/spec/mock/**', '**/mock/**'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'toolshop-api',
      testDir: './tests/spec',
      testMatch: ['**/spec/api/**', '**/api/**', '**/sanity/**'],
      use: {
        baseURL: process.env.API_URL || 'https://api.practicesoftwaretesting.com',
      },
    },
    {
      name: 'toolshop-mock',
      testDir: './tests/spec/mock',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
