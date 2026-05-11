import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // Run tests serially — they share a single dev server and Phaser global state.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: 'list',
  // Generous global timeout to handle the first-load Vite compile + Phaser asset loading.
  timeout: 45_000,

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    // Give every action a generous timeout; Phaser loads / renders asynchronously.
    actionTimeout: 10_000,
    // Capture a screenshot on failure for easier debugging.
    screenshot: 'only-on-failure',
    // Capture console output for debugging.
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the Vite dev server automatically before any tests run.
  webServer: {
    command: 'PLAYWRIGHT_TEST=1 npm run dev',
    url: 'http://localhost:5173',
    // Reuse an already-running server when developing locally; always start fresh in CI.
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
