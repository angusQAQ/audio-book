import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8011',
    headless: true,
    launchOptions: { executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: {
    command: 'python3 -m http.server 8011 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8011',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
